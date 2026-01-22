// GunnasTV - Configuration
export const API = window.APP_CONFIG?.API_URL || '/api';
export let hlsInstance = null;
export let currentEPGData = [];
export let appData = {
    streams: [],
    categories: {},
    categoryNames: {},
    accountInfo: null,
    selectedCategory: null,
    loaded: false
};

export function setHlsInstance(instance) {
    hlsInstance = instance;
}

export function setCurrentEPGData(data) {
    currentEPGData = data;
}

export function setAppData(data) {
    appData = data;
}
