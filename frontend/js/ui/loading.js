// GunnasTV - Loading Screen
export function updateLoadingProgress(percentage, message) {
    const logoFill = document.getElementById('logoFill');
    const loadingText = document.getElementById('loadingText');
    if (logoFill) logoFill.style.height = `${percentage}%`;
    if (loadingText) loadingText.textContent = message;
}

export function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

export function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.display = 'flex';
    loadingScreen.classList.remove('hidden');
}
