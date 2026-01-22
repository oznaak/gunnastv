// GunnasTV - Favorites Management
export function getFavoritesData() {
    const stored = localStorage.getItem('xtreamify_favorites');
    return stored ? JSON.parse(stored) : { channels: [], categories: [] };
}

export function saveFavoritesData(data) {
    localStorage.setItem('xtreamify_favorites', JSON.stringify(data));
}

export function toggleFavoriteChannel(streamId) {
    const favorites = getFavoritesData();
    const index = favorites.channels.indexOf(streamId);
    if (index > -1) {
        favorites.channels.splice(index, 1);
    } else {
        favorites.channels.push(streamId);
    }
    saveFavoritesData(favorites);
    return index === -1;
}

export function isFavoriteChannel(streamId) {
    const favorites = getFavoritesData();
    return favorites.channels.includes(streamId);
}

export function toggleFavoriteCategory(categoryId) {
    const favorites = getFavoritesData();
    const index = favorites.categories.indexOf(categoryId);
    if (index > -1) {
        favorites.categories.splice(index, 1);
    } else {
        favorites.categories.push(categoryId);
    }
    saveFavoritesData(favorites);
    return index === -1;
}

export function isFavoriteCategory(categoryId) {
    const favorites = getFavoritesData();
    return favorites.categories.includes(categoryId);
}

export function exportFavorites() {
    const favorites = getFavoritesData();
    const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        favorites: favorites
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'xtreamify-favorites.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function importFavorites(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                if (importData.favorites && importData.favorites.channels !== undefined && importData.favorites.categories !== undefined) {
                    saveFavoritesData(importData.favorites);
                    resolve({ success: true, message: 'Favorites imported successfully' });
                } else {
                    reject(new Error('Invalid favorites file format'));
                }
            } catch (err) {
                reject(new Error('Error reading file: ' + err.message));
            }
        };
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsText(file);
    });
}
