// GunnasTV - Utility Functions
export function getStoredCredentials() {
    try {
        return JSON.parse(localStorage.getItem('xtream_credentials') || '{}');
    } catch {
        return {};
    }
}

export function saveStoredCredentials(credentials) {
    localStorage.setItem('xtream_credentials', JSON.stringify(credentials));
}

export function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
