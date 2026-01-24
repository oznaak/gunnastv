// GunnasTV - HLS Player
import { API, hlsInstance, setHlsInstance, currentEPGData, setCurrentEPGData } from './config.js';
import { fetchStreamUrl, fetchEPGData } from './api.js';
import { escapeHtml } from './utils.js';
import { translations, getLang } from './translations.js';

export async function openPlayer(streamId, streamName) {
    const playerOverlay = document.getElementById('playerOverlay');
    const video = document.getElementById('video');
    const loader = document.getElementById('videoLoader');
    const title = document.getElementById('nowPlayingTitle');
    const epgInfo = document.getElementById('epgInfo');
    const epgGuideList = document.getElementById('epgGuideList');
    const token = localStorage.getItem('token');

    title.textContent = decodeURIComponent(streamName);
    
    setCurrentEPGData([]);
    const lang = getLang();
    const t = translations[lang];
    epgInfo.innerHTML = `<div class="text-sm text-gray-300">${t.noInfo}</div>`;
    epgInfo.classList.remove('hidden');
    
    epgGuideList.scrollTop = 0;

    playerOverlay.classList.add('player-active');
    loader.classList.replace('opacity-0', 'opacity-100');

    try {
        const data = await fetchStreamUrl(streamId, token);
        const url = atob(data.u);

        if (Hls.isSupported()) {
            if (hlsInstance) hlsInstance.destroy();

            // Tuned Hls.js config for better stability and audio quality
            const hlsConfig = {
                maxBufferLength: 60,            // seconds of buffer
                maxMaxBufferLength: 120,        // upper limit for buffer
                maxBufferHole: 0.5,             // tolerate small gaps
                maxBufferSize: 60 * 1000 * 1000, // bytes
                capLevelToPlayerSize: true,
                abrEwmaFastLive: 3,
                abrEwmaSlowLive: 9,
                startLevel: -1,
                // Ensure Hls XHRs don't send credentials; keep requests simple
                xhrSetup: function(xhr, url) {
                    xhr.withCredentials = false;
                }
            };

            // Ensure CORS is set on video element
            video.crossOrigin = 'anonymous';

            const newHls = new Hls(hlsConfig);
            setHlsInstance(newHls);
            newHls.loadSource(url);
            newHls.attachMedia(video);
        } else {
            video.crossOrigin = 'anonymous';
            video.src = url;
        }

        fetchAndDisplayEPG(streamId);
    } catch (err) {
        console.error("Failed to load stream", err);
        loader.classList.replace('opacity-100', 'opacity-0');
    }
}

export async function fetchAndDisplayEPG(streamId) {
    try {
        const token = localStorage.getItem('token');
        const epgData = await fetchEPGData(streamId, token);

        if (!epgData) return;

        if (epgData.epg_listings && epgData.epg_listings.length > 0) {
            setCurrentEPGData(epgData.epg_listings);
            
            const now = Math.floor(Date.now() / 1000);
            const lang = getLang();
            
            const current = epgData.epg_listings.find(e => e.start <= now && now < e.end);
            const next = epgData.epg_listings.find(e => e.start > now);

            const epgInfo = document.getElementById('epgInfo');
            if (epgInfo && (current || next)) {
                let epgHtml = '';
                
                if (current) {
                    const startTime = new Date(current.start * 1000).toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
                    const safeTitle = escapeHtml(current.title || '');
                    epgHtml += `<div class="text-sm text-gray-300">${startTime} - ${safeTitle}</div>`;
                }
                if (next) {
                    const startTime = new Date(next.start * 1000).toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
                    const safeTitle = escapeHtml(next.title || '');
                    epgHtml += `<div class="text-sm text-gray-300">${startTime} - ${safeTitle}</div>`;
                }
                if (epgHtml) {
                    epgInfo.innerHTML = epgHtml;
                    epgInfo.classList.remove('hidden');
                }
            }
        }
    } catch (err) {
        console.error("Failed to fetch EPG data:", err);
    }
}

export function closePlayer() {
    const playerOverlay = document.getElementById('playerOverlay');
    const epgGuidePanel = document.getElementById('epgGuidePanel');
    const video = document.getElementById('video');
    const loader = document.getElementById('videoLoader');

    playerOverlay.classList.remove('player-active');
    loader.classList.replace('opacity-100', 'opacity-0');
    
    epgGuidePanel.classList.remove('translate-y-0');
    epgGuidePanel.classList.add('translate-y-full');

    video.pause();
    if (hlsInstance) {
        hlsInstance.destroy();
        setHlsInstance(null);
    }
    video.src = "";
}

export function toggleEPGGuide() {
    const epgGuidePanel = document.getElementById('epgGuidePanel');
    const isOpen = epgGuidePanel.classList.contains('translate-y-0');
    
    if (isOpen) {
        epgGuidePanel.classList.remove('translate-y-0');
        epgGuidePanel.classList.add('translate-y-full');
    } else {
        populateEPGGuide();
        epgGuidePanel.classList.remove('translate-y-full');
        epgGuidePanel.classList.add('translate-y-0');
    }
}

function populateEPGGuide() {
    const epgGuideList = document.getElementById('epgGuideList');
    const lang = getLang();
    const t = translations[lang];
    
    if (currentEPGData.length === 0) {
        epgGuideList.innerHTML = '<p class="text-gray-400 text-center">' + t.noEPGData + '</p>';
        return;
    }
    
    const sortedEPG = [...currentEPGData].sort((a, b) => a.start - b.start);
    const now = Math.floor(Date.now() / 1000);
    const firstFutureIndex = sortedEPG.findIndex(epg => epg.end > now);
    const futureEPG = firstFutureIndex >= 0 ? sortedEPG.slice(firstFutureIndex) : sortedEPG;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(today.getTime() / 1000);
    
    let htmlContent = '';
    let lastDateLabel = null;
    
    htmlContent += futureEPG.map((epg, idx) => {
        const programDate = new Date(epg.start * 1000);
        const programDateMidnight = new Date(programDate);
        programDateMidnight.setHours(0, 0, 0, 0);
        const programDateTimestamp = Math.floor(programDateMidnight.getTime() / 1000);
        
        const startTime = programDate.toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(epg.end * 1000).toLocaleTimeString(lang === 'pt' ? 'pt-BR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        
        let dateLabel = '';
        
        if (lastDateLabel !== programDateTimestamp) {
            lastDateLabel = programDateTimestamp;
            
            let dateHeaderText = '';
            if (programDateTimestamp === todayTimestamp) {
                dateHeaderText = '';
            } else if (programDateTimestamp === todayTimestamp + 86400) {
                dateHeaderText = t.tomorrow;
            } else {
                const dayOfWeek = programDate.getDay();
                dateHeaderText = t.days[dayOfWeek];
            }
            
            if (dateHeaderText) {
                dateLabel = `<div class="text-xs font-semibold text-blue-400 uppercase mt-4 mb-2">${dateHeaderText}</div>`;
            }
        }
        
        const isNowPlaying = idx === 0;
        const highlightClass = isNowPlaying ? 'bg-blue-900/50 border border-blue-500/50' : 'bg-gray-800/50';
        
        let progressBar = '';
        if (isNowPlaying && epg.start <= now && now < epg.end) {
            const totalDuration = epg.end - epg.start;
            const elapsed = now - epg.start;
            const progressPercent = Math.min((elapsed / totalDuration) * 100, 100);
            
            progressBar = `
                <div class="mt-3 bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-blue-500 h-full rounded-full transition-all" style="width: ${progressPercent}%"></div>
                </div>
            `;
        }
        
        return dateLabel + `
            <div class="p-3 ${highlightClass} rounded-lg hover:bg-gray-700/50 transition-colors">
                <div class="font-medium text-white">${escapeHtml(epg.title || '(No title)')}</div>
                <div class="text-sm text-gray-400 mt-1">${startTime} - ${endTime}</div>
                ${progressBar}
                ${epg.description ? `<div class="text-sm text-gray-500 mt-2">${escapeHtml(epg.description)}</div>` : ''}
            </div>
        `;
    }).join('');
    
    epgGuideList.innerHTML = htmlContent;
}

export function togglePlay() {
    const video = document.getElementById('video');
    if (video.paused) video.play();
    else video.pause();
}

export function updateVolume(value) {
    const video = document.getElementById('video');
    video.volume = value;
    video.muted = (value == 0);
    localStorage.setItem('volume', value);
    document.getElementById('muteBtn').textContent = value == 0 ? "🔇" : "🔊";
}

export function toggleMute() {
    const video = document.getElementById('video');
    const slider = document.getElementById('volumeSlider');
    video.muted = !video.muted;
    const newVolume = video.muted ? 0 : (localStorage.getItem('volume') || 1);
    slider.value = newVolume;
    video.volume = newVolume;
    document.getElementById('muteBtn').textContent = video.muted ? "🔇" : "🔊";
    localStorage.setItem('volume', newVolume);
}

export function toggleFullscreen() {
    const overlay = document.getElementById('playerOverlay');
    if (!document.fullscreenElement) overlay.requestFullscreen();
    else document.exitFullscreen();
}
