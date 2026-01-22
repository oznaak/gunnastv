// GunnasTV - EPG Guide View
import { appData } from '../config.js';
import { getLang } from '../translations.js';
import { getFavoritesData } from '../favorites.js';
import { fetchEPGBatch } from '../api.js';
import { escapeHtml } from '../utils.js';

export function renderEPGView() {
    if (!appData.loaded) return;

    const categorySelector = document.getElementById('categorySelector');
    const dateDisplay = document.getElementById('dateDisplay');
    const lang = getLang();
    
    // Display current date
    const today = new Date();
    const localeString = lang === 'en' ? 'en-US' : 'pt-BR';
    const dateStr = today.toLocaleDateString(localeString, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (dateDisplay) dateDisplay.textContent = dateStr;

    // Populate category selector
    categorySelector.innerHTML = '';

    // Add Favorites option first
    const favoritesOption = document.createElement('option');
    favoritesOption.value = '__favorites__';
    favoritesOption.textContent = lang === 'en' ? 'Favorites' : 'Favoritos';
    categorySelector.appendChild(favoritesOption);

    // Add placeholder option (selected by default)
    const placeholderText = lang === 'en' ? '-- Select a category --' : '-- Selecionar uma categoria --';
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholderText;
    placeholderOption.selected = true;
    categorySelector.appendChild(placeholderOption);

    const catIds = Object.keys(appData.categories).sort((a, b) => {
        const nameA = (appData.categoryNames[a] || "").toLowerCase();
        const nameB = (appData.categoryNames[b] || "").toLowerCase();
        return nameA.localeCompare(nameB);
    });

    catIds.forEach(catId => {
        const option = document.createElement('option');
        option.value = catId;
        option.textContent = appData.categoryNames[catId];
        categorySelector.appendChild(option);
    });

    categorySelector.classList.add('loaded');

    // Set up change handler
    categorySelector.onchange = async (e) => {
        const catId = e.target.value;
        if (catId === '__favorites__') {
            const favoriteIds = getFavoritesData().channels;
            const channelsToDisplay = appData.streams.filter(s => favoriteIds.includes(String(s.stream_id)));
            await loadEPGForCategory(catId, channelsToDisplay);
        } else if (catId && appData.categories[catId]) {
            const channelsToDisplay = appData.categories[catId].slice(1);
            await loadEPGForCategory(catId, channelsToDisplay);
        }
    };
}

async function loadEPGForCategory(categoryId, channels) {
    const channelsList = document.getElementById('channelsList');
    const timeSlots = document.getElementById('timeSlots');
    const programsGrid = document.getElementById('programsGrid');
    const lang = getLang();
    const token = localStorage.getItem('token');

    const loadingText = lang === 'en' ? 'Loading channels data...' : 'A carregar programas dos canais...';
    const channelsText = lang === 'en' ? 'channels' : 'canais';
    
    channelsList.innerHTML = '<div class="p-4 text-gray-400">' + (lang === 'en' ? 'Loading...' : 'A carregar...') + '</div>';
    timeSlots.innerHTML = '';
    
    programsGrid.innerHTML = `
        <div class="loading-container">
            <div class="loading-text">${loadingText}</div>
            <div class="progress-bar">
                <div id="progressFill" class="progress-fill" style="width: 0%"></div>
            </div>
            <div id="loadingStatus" class="loading-text">0 / ${channels.length} ${channelsText}</div>
        </div>
    `;

    try {
        // Calculate time range
        const now = Math.floor(Date.now() / 1000);
        const pastHours = 4;
        const futureHours = 48;
        const timeStart = now - (pastHours * 3600);
        const timeEnd = now + (futureHours * 3600);

        // Generate hourly time slots
        const timeSlots_data = [];
        const startHour = new Date(timeStart * 1000);
        startHour.setMinutes(0, 0, 0);
        let currentHour = Math.floor(startHour.getTime() / 1000);
        
        while (currentHour <= timeEnd) {
            timeSlots_data.push(currentHour);
            currentHour += 3600;
        }

        // Fetch EPG data for all channels using batch endpoint
        const allEPGData = {};
        let loadedChannels = 0;
        
        const BATCH_SIZE = 10;
        const batches = [];
        for (let i = 0; i < channels.length; i += BATCH_SIZE) {
            batches.push(channels.slice(i, i + BATCH_SIZE));
        }
        
        for (const batch of batches) {
            try {
                const streamIds = batch.map(ch => ch.stream_id);
                const data = await fetchEPGBatch(streamIds, token);
                
                if (data.results) {
                    for (const [streamId, epgData] of Object.entries(data.results)) {
                        allEPGData[streamId] = epgData.epg_listings || [];
                    }
                }
            } catch (err) {
                console.error('Failed to fetch EPG batch:', err);
                batch.forEach(ch => {
                    allEPGData[ch.stream_id] = [];
                });
            }
            
            loadedChannels += batch.length;
            const progressPercent = (loadedChannels / channels.length) * 100;
            const progressFill = document.getElementById('progressFill');
            const loadingStatus = document.getElementById('loadingStatus');
            if (progressFill) {
                progressFill.style.width = progressPercent + '%';
            }
            if (loadingStatus) {
                loadingStatus.textContent = loadedChannels + ' / ' + channels.length + ' ' + channelsText;
            }
        }

        // Render time slots header
        timeSlots.innerHTML = timeSlots_data.map(ts => {
            const date = new Date(ts * 1000);
            const hour = date.getHours();
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            const timeStr = `${displayHour} ${ampm}`;
            return `<div class="time-slot">${timeStr}</div>`;
        }).join('');

        // Render channels and programs grid
        channelsList.innerHTML = '<div style="height: 50px; flex-shrink: 0;"></div>' + channels.map(ch => {
            const name = ch.name.replace(/✦●✦/g, '').replace(/^[A-Z]{2}\|/g, '').trim();
            const safeName = escapeHtml(name);
            return `<div class="channel-label" title="${safeName}">${safeName}</div>`;
        }).join('');

        const slotWidth = 120;
        const timeWindowSeconds = timeSlots_data.length * 3600;
        const totalRowWidth = timeSlots_data.length * slotWidth;

        programsGrid.innerHTML = channels.map(channel => {
            const epgListings = (allEPGData[channel.stream_id] || []).slice().sort((a, b) => a.start - b.start);
            
            return `
                <div class="channel-row">
                    <div class="programs-row" style="position: relative; width: ${totalRowWidth}px;">
                        ${(() => {
                            let html = '';
                            const renderedProgramIds = new Set();
                            const firstSlotTime = timeSlots_data[0];
                            let lastPlacedEndSeconds = -Infinity;
                            
                            epgListings.forEach(program => {
                                const programId = program.start + '-' + program.end + '-' + program.title;
                                if (renderedProgramIds.has(programId)) return;
                                renderedProgramIds.add(programId);

                                let programStartSeconds = program.start - firstSlotTime;
                                let programEndSeconds = program.end - firstSlotTime;

                                if (programEndSeconds < 0 || programStartSeconds > timeWindowSeconds) return;

                                if (programStartSeconds < lastPlacedEndSeconds) {
                                    programStartSeconds = lastPlacedEndSeconds;
                                }

                                const visibleStart = Math.max(0, programStartSeconds);
                                const visibleEnd = Math.min(timeWindowSeconds, programEndSeconds);
                                const visibleDuration = Math.max(0, visibleEnd - visibleStart);

                                if (visibleDuration <= 0) return;

                                const left = (visibleStart / 3600) * slotWidth;
                                const width = Math.max(12, (visibleDuration / 3600) * slotWidth);

                                const isCurrent = program.start <= now && now < program.end ? 'current' : '';
                                const compactClass = width < 70 ? 'compact-program' : '';
                                const tinyClass = width < 40 ? 'tiny-program' : '';
                                const safeTitle = escapeHtml(program.title || '');
                                const safeDescription = escapeHtml(program.description || '');
                                const displayTitle = width < 26 ? '' : safeTitle;
                                
                                html += '<div class="program-cell ' + isCurrent + ' ' + compactClass + ' ' + tinyClass + '" title="' + safeTitle + '" data-title="' + safeTitle + '" data-description="' + safeDescription + '" data-start="' + program.start + '" data-end="' + program.end + '" style="left: ' + left + 'px; width: ' + width + 'px;">' + displayTitle + '</div>';

                                lastPlacedEndSeconds = Math.max(lastPlacedEndSeconds, programEndSeconds);
                            });
                            
                            return html;
                        })()}
                    </div>
                </div>
            `;
        }).join('');

        // Synchronize vertical scroll
        channelsList.addEventListener('scroll', () => {
            programsGrid.scrollTop = channelsList.scrollTop;
        });

        programsGrid.addEventListener('scroll', () => {
            channelsList.scrollTop = programsGrid.scrollTop;
        });

        // Allow wheel on timeline header to scroll the programs grid
        const timeSlotElement = document.getElementById('timeSlots');
        if (!timeSlotElement.dataset.wheelbound) {
            timeSlotElement.addEventListener('wheel', (e) => {
                programsGrid.scrollLeft += (e.deltaX || 0) + (e.deltaY || 0);
                e.preventDefault();
            }, { passive: false });
            timeSlotElement.dataset.wheelbound = '1';
        }

        // Program detail modal handling
        const programModal = document.getElementById('programModal');
        const modalName = document.getElementById('programModalName');
        const modalStart = document.getElementById('programModalStart');
        const modalEnd = document.getElementById('programModalEnd');
        const modalDescription = document.getElementById('programModalDescription');
        const modalCloseBtn = document.getElementById('closeProgramModal');

        const formatHourMinute = (ts) => {
            const d = new Date(ts * 1000);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        const showProgramModal = ({ title, start, end, description }) => {
            if (!programModal) return;
            modalName.textContent = title || '';
            modalStart.textContent = start ? formatHourMinute(start) : '';
            modalEnd.textContent = end ? formatHourMinute(end) : '';
            if (modalDescription) {
                modalDescription.textContent = description || '';
                modalDescription.style.display = description ? 'block' : 'none';
            }
            programModal.classList.add('show');
        };

        const hideProgramModal = () => {
            if (!programModal) return;
            programModal.classList.remove('show');
        };

        if (programModal && !programModal.dataset.bound) {
            programModal.addEventListener('click', (e) => {
                if (e.target === programModal) hideProgramModal();
            });
            if (modalCloseBtn) {
                modalCloseBtn.addEventListener('click', hideProgramModal);
            }
            programModal.dataset.bound = '1';
        }

        if (!programsGrid.dataset.modalbound) {
            programsGrid.addEventListener('click', (e) => {
                const cell = e.target.closest('.program-cell');
                if (!cell) return;
                const title = cell.dataset.title || cell.textContent.trim();
                const startTs = Number(cell.dataset.start) || null;
                const endTs = Number(cell.dataset.end) || null;
                const description = cell.dataset.description || '';
                showProgramModal({ title, start: startTs, end: endTs, description });
            });
            programsGrid.dataset.modalbound = '1';
        }

        // Add current time indicator
        addCurrentTimeIndicator(timeSlots_data, programsGrid);
        setInterval(() => addCurrentTimeIndicator(timeSlots_data, programsGrid), 60000);

    } catch (err) {
        console.error('Failed to load EPG for category:', err);
        programsGrid.innerHTML = '<div class="p-4 text-red-500">' + (lang === 'en' ? 'Failed to load EPG data' : 'Falha ao carregar dados de EPG') + '</div>';
    }
}

function addCurrentTimeIndicator(timeSlots_data, programsGrid) {
    const gridWrapper = document.querySelector('.epg-grid-wrapper');
    const existingIndicator = document.querySelector('.current-time-indicator');
    if (existingIndicator) existingIndicator.remove();

    const indicator = document.createElement('div');
    indicator.className = 'current-time-indicator';
    gridWrapper.appendChild(indicator);

    const now = Math.floor(Date.now() / 1000);
    const firstSlotTime = timeSlots_data[0];
    const lastSlotTime = timeSlots_data[timeSlots_data.length - 1];
    
    if (now >= firstSlotTime && now <= lastSlotTime) {
        const slotWidth = 120;
        const timeSinceStart = now - firstSlotTime;
        const estimatedPixels = (timeSinceStart / 3600) * slotWidth;
        
        const updateIndicatorPosition = () => {
            const scrollOffset = programsGrid.scrollLeft;
            indicator.style.left = (estimatedPixels - scrollOffset) + 'px';
        };
        
        updateIndicatorPosition();
        programsGrid.addEventListener('scroll', updateIndicatorPosition);
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
    }
}
