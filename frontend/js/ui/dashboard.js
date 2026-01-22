// GunnasTV - Dashboard View
import { appData } from '../config.js';
import { escapeHtml } from '../utils.js';
import { translations, getLang, applyLanguage } from '../translations.js';
import { 
    getFavoritesData, 
    toggleFavoriteChannel, 
    toggleFavoriteCategory, 
    isFavoriteChannel, 
    isFavoriteCategory 
} from '../favorites.js';
import { openPlayer } from '../player.js';

export function renderDashboard() {
    const categoryList = document.getElementById('categoryList');
    const container = document.getElementById('streams');
    const searchInput = document.getElementById('channelSearch');
    const searchContainer = document.getElementById('searchContainer');
    const t = translations[getLang()];

    if (!appData.loaded) {
        container.innerHTML = `<p class="col-span-full text-center text-gray-500">${t.loading}</p>`;
        return;
    }

    // Render categories
    categoryList.innerHTML = '';
    
    // Add Favorites category first
    const favoritesLi = document.createElement('li');
    favoritesLi.textContent = getLang() === 'en' ? 'Favorite Channels' : 'Canais Favoritos';
    favoritesLi.setAttribute('data-id', '__favorites__');
    favoritesLi.className = 'p-2 hover:bg-gray-700 rounded cursor-pointer transition-colors mb-1 text-sm whitespace-nowrap overflow-hidden text-ellipsis font-semibold';
    favoritesLi.onclick = () => showCategory('__favorites__');
    categoryList.appendChild(favoritesLi);
    
    // Get favorite categories data once
    const favoriteCategoryIds = getFavoritesData().categories;
    
    // Add favorite categories under Favorites section
    if (favoriteCategoryIds.length > 0) {
        const labelLi = document.createElement('li');
        labelLi.textContent = getLang() === 'en' ? 'Favorite Categories' : 'Categorias Favoritas';
        labelLi.className = 'px-2 pt-3 pb-1 text-xs text-gray-400 uppercase tracking-wide pointer-events-none';
        categoryList.appendChild(labelLi);
        
        favoriteCategoryIds.forEach(catId => {
            if (appData.categories[catId]) {
                const li = document.createElement('li');
                li.setAttribute('data-id', catId);
                li.className = 'p-2 hover:bg-gray-700 rounded cursor-pointer transition-colors mb-1 text-sm whitespace-nowrap overflow-hidden text-ellipsis pl-6 flex items-center gap-2';
                
                const firstStream = appData.categories[catId][0];
                const safeIconUrl = escapeHtml(firstStream?.stream_icon || 'https://via.placeholder.com/32x32?text=?');
                const safeCatName = escapeHtml(appData.categoryNames[catId] || `Category ${catId}`);
                
                li.innerHTML = `
                    <img src="${safeIconUrl}" onerror="this.src='https://via.placeholder.com/32x32?text=?'" class="w-6 h-6 min-w-6 min-h-6 rounded-full object-cover flex-shrink-0" />
                    <span class="truncate">${safeCatName}</span>
                `;
                li.onclick = () => showCategory(catId);
                categoryList.appendChild(li);
            }
        });
    }
    
    // Add divider
    const divider = document.createElement('li');
    divider.className = 'border-t border-gray-700 my-2';
    categoryList.appendChild(divider);
    
    // Add label for all categories
    const allCategoriesLabel = document.createElement('li');
    allCategoriesLabel.textContent = getLang() === 'en' ? 'Select a category' : 'Selecione uma categoria';
    allCategoriesLabel.className = 'px-2 pt-3 pb-1 text-xs text-gray-400 uppercase tracking-wide pointer-events-none';
    categoryList.appendChild(allCategoriesLabel);
    
    // Add regular categories (excluding favorited ones)
    const catIds = Object.keys(appData.categories).sort((a, b) => {
        const nameA = (appData.categoryNames[a] || "").toLowerCase();
        const nameB = (appData.categoryNames[b] || "").toLowerCase();
        return nameA.localeCompare(nameB);
    });

    catIds.forEach(catId => {
        if (favoriteCategoryIds.includes(catId)) return;
        
        const li = document.createElement('li');
        li.setAttribute('data-id', catId);
        li.className = 'p-2 hover:bg-gray-700 rounded cursor-pointer transition-colors mb-1 text-sm whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2';
        
        const firstStream = appData.categories[catId][0];
        const safeIconUrl = escapeHtml(firstStream?.stream_icon || 'https://via.placeholder.com/32x32?text=?');
        const safeCatName = escapeHtml(appData.categoryNames[catId] || `Category ${catId}`);
        
        li.innerHTML = `
            <img src="${safeIconUrl}" onerror="this.src='https://via.placeholder.com/32x32?text=?'" class="w-6 h-6 min-w-6 min-h-6 rounded-full object-cover flex-shrink-0" />
            <span class="truncate">${safeCatName}</span>
        `;
        li.onclick = () => showCategory(catId);
        categoryList.appendChild(li);
    });

    // Empty state
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center w-full h-full col-span-full opacity-50 text-center">
            <svg class="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <p class="text-xl font-medium">${t.selectCategory}</p>
        </div>
    `;

    if (searchContainer) searchContainer.classList.add('hidden');
    
    // Restore previously selected category
    if (appData.selectedCategory) {
        showCategory(appData.selectedCategory);
    }
}

export function showCategory(catId) {
    const categoryList = document.getElementById('categoryList');
    const container = document.getElementById('streams');
    const searchInput = document.getElementById('channelSearch');
    const searchContainer = document.getElementById('searchContainer');
    const t = translations[getLang()];
    
    appData.selectedCategory = catId;
    searchContainer.classList.remove('hidden');
    
    Array.from(categoryList.children).forEach(li => {
        const isSelected = li.getAttribute('data-id') === catId;
        li.classList.toggle('bg-blue-600', isSelected);
        li.classList.toggle('bg-gray-700', false);
    });

    // Set title with heart icon
    const categoryTitle = document.getElementById('categoryTitle');
    if (catId === '__favorites__') {
        categoryTitle.innerHTML = getLang() === 'en' ? 'Favorites' : 'Favoritos';
    } else {
        const isFav = isFavoriteCategory(catId);
        const heartIcon = isFav ? '❤️' : '🤍';
        const categoryName = escapeHtml(appData.categoryNames[catId] || '');
        const safeCatId = escapeHtml(catId);
        categoryTitle.innerHTML = `
            <span>${categoryName}</span>
            <button onclick="window.toggleCategoryFavorite('${safeCatId}')" class="ml-3 text-xl hover:scale-125 transition-transform">${heartIcon}</button>
        `;
    }

    const createChannelCard = (s) => {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200 relative';
        
        const streamIdStr = String(s.stream_id);
        const isFavorite = isFavoriteChannel(streamIdStr);
        const heartIcon = isFavorite ? '❤️' : '🤍';
        
        const safeName = escapeHtml(s.name);
        const safeIcon = escapeHtml(s.stream_icon || '');
        card.innerHTML = `
            <div class="h-32 bg-gray-900 flex items-center justify-center">
                <img src="${safeIcon}" onerror="this.src='https://via.placeholder.com/150x100?text=No+Icon'" class="max-h-full object-contain" />
            </div>
            <div class="p-3 flex items-center justify-between">
                <div class="font-medium truncate text-sm flex-1">${safeName}</div>
                <button class="favorite-btn ml-2 text-lg hover:scale-125 transition-transform" data-stream-id="${streamIdStr}" onclick="event.stopPropagation()">${heartIcon}</button>
            </div>
        `;
        card.onclick = () => openPlayer(s.stream_id, s.name);
        
        const favoriteBtn = card.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const streamId = favoriteBtn.getAttribute('data-stream-id');
            const isNowFavorite = toggleFavoriteChannel(streamId);
            favoriteBtn.textContent = isNowFavorite ? '❤️' : '🤍';
            renderChannels(searchInput.value);
        });
        
        return card;
    };
    
    const renderCategoryGroup = (groupName, channels, filter, groupId) => {
        const groupHeader = document.createElement('div');
        groupHeader.className = 'col-span-full mt-6 mb-4 flex items-center gap-3 cursor-pointer group self-start';
        groupHeader.id = groupId;
        const safeGroupName = escapeHtml(groupName);
        groupHeader.innerHTML = `
            <span class="text-lg font-semibold">${safeGroupName}</span>
            <span class="text-sm text-gray-400">${channels.length}</span>
            <span class="ml-auto text-gray-400 group-hover:text-white transition-colors select-none outline-none focus:outline-none" style="pointer-events: none;">▼</span>
        `;
        groupHeader.onclick = () => toggleCategoryGroup(groupId);
        container.appendChild(groupHeader);

        const groupContainer = document.createElement('div');
        groupContainer.className = 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 col-span-full transition-all mb-4 self-start';
        groupContainer.id = `${groupId}-container`;
        
        channels.forEach(s => {
            groupContainer.appendChild(createChannelCard(s));
        });
        container.appendChild(groupContainer);
    };

    const renderChannels = (filter = '') => {
        container.innerHTML = '';
        
        let channels = [];
        
        if (catId === '__favorites__') {
            const favoriteIds = getFavoritesData().channels;
            channels = appData.streams.filter(s => favoriteIds.includes(String(s.stream_id)));
            
            if (channels.length === 0) {
                container.innerHTML = `<p class="col-span-full text-center py-10 text-gray-500">${t.noChannels}</p>`;
                return;
            }
            
            const grouped = {};
            channels.forEach(s => {
                const catId = s.category_id;
                if (!grouped[catId]) grouped[catId] = [];
                grouped[catId].push(s);
            });
            
            Object.keys(grouped).sort((a, b) => {
                const nameA = (appData.categoryNames[a] || "").toLowerCase();
                const nameB = (appData.categoryNames[b] || "").toLowerCase();
                return nameA.localeCompare(nameB);
            }).forEach(groupCatId => {
                let groupChannels = grouped[groupCatId].filter(s =>
                    s.name.toLowerCase().includes(filter.toLowerCase())
                );
                
                if (groupChannels.length === 0) return;
                
                groupChannels.sort((a, b) => {
                    const aIsFav = isFavoriteChannel(String(a.stream_id)) ? 0 : 1;
                    const bIsFav = isFavoriteChannel(String(b.stream_id)) ? 0 : 1;
                    return aIsFav - bIsFav;
                });
                
                renderCategoryGroup(appData.categoryNames[groupCatId] || `Category ${groupCatId}`, groupChannels, filter, `fav-cat-${groupCatId}`);
            });
            
        } else {
            channels = appData.categories[catId];
            
            if (channels.length === 0) {
                container.innerHTML = `<p class="col-span-full text-center py-10 text-gray-500">${t.noChannels}</p>`;
                return;
            }
            
            const grouped = {};
            channels.forEach(s => {
                const subCatId = s.category_id;
                if (!grouped[subCatId]) grouped[subCatId] = [];
                grouped[subCatId].push(s);
            });
            
            Object.keys(grouped).sort((a, b) => {
                const nameA = (appData.categoryNames[a] || "").toLowerCase();
                const nameB = (appData.categoryNames[b] || "").toLowerCase();
                return nameA.localeCompare(nameB);
            }).forEach(groupCatId => {
                let groupChannels = grouped[groupCatId].filter(s =>
                    s.name.toLowerCase().includes(filter.toLowerCase())
                );
                
                if (groupChannels.length === 0) return;
                
                groupChannels.sort((a, b) => {
                    const aIsFav = isFavoriteChannel(String(a.stream_id)) ? 0 : 1;
                    const bIsFav = isFavoriteChannel(String(b.stream_id)) ? 0 : 1;
                    return aIsFav - bIsFav;
                });
                
                renderCategoryGroup(appData.categoryNames[groupCatId] || `Category ${groupCatId}`, groupChannels, filter, `cat-${groupCatId}`);
            });
        }
    };

    renderChannels();
    searchInput.value = '';
    searchInput.oninput = (e) => renderChannels(e.target.value);
}

function toggleCategoryGroup(groupId) {
    const containerId = `${groupId}-container`;
    const container = document.getElementById(containerId);
    const header = document.getElementById(groupId);
    
    if (container && header) {
        const isHidden = container.classList.contains('hidden');
        container.classList.toggle('hidden');
        
        if (isHidden) {
            header.classList.remove('mb-2');
            header.classList.add('mb-4');
        } else {
            header.classList.remove('mb-4');
            header.classList.add('mb-2');
        }
        
        const arrow = header.querySelector('span:last-child');
        if (arrow) {
            arrow.textContent = container.classList.contains('hidden') ? '◀' : '▼';
        }
    }
}

// Global function for category favorite toggle
window.toggleCategoryFavorite = (catId) => {
    toggleFavoriteCategory(catId);
    renderDashboard();
    showCategory(catId);
};
