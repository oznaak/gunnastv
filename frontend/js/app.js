// GunnasTV - Main Entry Point
import { router } from './router.js';
import { initApp, loginUser, logout } from './auth.js';
import { closePlayer, togglePlay, updateVolume, toggleMute, toggleFullscreen, toggleEPGGuide } from './player.js';
import { applyLanguage } from './translations.js';
import { hideLoadingScreen } from './ui/loading.js';

// Make functions globally available for HTML onclick handlers
window.loginUser = loginUser;
window.closePlayer = closePlayer;
window.togglePlay = togglePlay;
window.updateVolume = updateVolume;
window.toggleMute = toggleMute;
window.toggleFullscreen = toggleFullscreen;
window.toggleEPGGuide = toggleEPGGuide;

// Event listeners setup
document.addEventListener('DOMContentLoaded', () => {
    // Setup nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = link.getAttribute('data-route');
            router.navigate('/' + route);
        });
    });

    // Setup logout buttons
    document.querySelectorAll('.logout-btn, #logoutBtn').forEach(btn => {
        btn.addEventListener('click', logout);
    });

    // Setup favorites file input
    const favInput = document.getElementById('favoriteFileInput');
    if (favInput) {
        favInput.addEventListener('change', window.importFavoritesHandler);
    }

    // Initialize router
    router.init();

    // If authenticated, load app data
    const token = localStorage.getItem('token');
    if (token) {
        initApp();
    } else {
        hideLoadingScreen();
    }
});

// Video player event listeners
const video = document.getElementById('video');
const loader = document.getElementById('videoLoader');

if (video && loader) {
    video.addEventListener('playing', () => {
        loader.classList.replace('opacity-100', 'opacity-0');
    });

    video.addEventListener('waiting', () => {
        loader.classList.replace('opacity-0', 'opacity-100');
    });

    video.addEventListener('pause', () => {
        if (loader) loader.classList.replace('opacity-100', 'opacity-0');
        const playIcon = document.getElementById('playIcon');
        if (playIcon) playIcon.textContent = "▶";
    });

    video.addEventListener('play', () => {
        const playIcon = document.getElementById('playIcon');
        if (playIcon) playIcon.textContent = "⏸";
    });
}

// Restore saved volume
const savedVolume = localStorage.getItem('volume');
if (video && savedVolume !== null) {
    video.volume = Number(savedVolume);
    const volumeSlider = document.getElementById('volumeSlider');
    const muteBtn = document.getElementById('muteBtn');
    if (volumeSlider) volumeSlider.value = savedVolume;
    if (muteBtn) muteBtn.textContent = savedVolume == 0 ? "🔇" : "🔊";
}

// Scroll up to exit player
window.addEventListener('wheel', (e) => {
    const overlay = document.getElementById('playerOverlay');
    const epgGuidePanel = document.getElementById('epgGuidePanel');
    
    if (e.target.closest('#epgGuidePanel')) return;
    
    const isEPGOpen = epgGuidePanel && epgGuidePanel.classList.contains('translate-y-0');
    
    if (overlay && overlay.classList.contains('player-active') && !document.fullscreenElement && e.deltaY < -50) {
        if (isEPGOpen) {
            toggleEPGGuide();
        } else {
            closePlayer();
        }
    }
});

// Mouse movement controls hide
let controlsTimeout;
const playerOverlay = document.getElementById('playerOverlay');
if (playerOverlay) {
    playerOverlay.addEventListener('mousemove', () => {
        const topBar = document.getElementById('topBar');
        const controlBar = document.getElementById('controlBar');
        if (!topBar || !controlBar) return;

        topBar.style.opacity = "1";
        controlBar.style.opacity = "1";
        if (video) video.style.cursor = "default";

        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => {
            if (video && !video.paused) {
                topBar.style.opacity = "0";
                controlBar.style.opacity = "0";
                video.style.cursor = "none";
            }
        }, 3000);
    });
}

// Language dropdown click outside
window.addEventListener('click', (event) => {
    if (!event.target.closest('.relative')) {
        const dropdown = document.getElementById('langDropdown');
        if (dropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    }
});

// Apply language on initial load
applyLanguage();
