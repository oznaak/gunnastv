// GunnasTV - Authentication
import { API, appData, setAppData } from './config.js';
import { loginRequest, fetchStreams, fetchAccountInfo } from './api.js';
import { saveStoredCredentials, getStoredCredentials } from './utils.js';
import { translations, getLang } from './translations.js';
import { updateLoadingProgress, hideLoadingScreen, showLoadingScreen } from './ui/loading.js';
import { router } from './router.js';

export async function initApp() {
    const token = localStorage.getItem('token');
    if (!token) {
        hideLoadingScreen();
        router.navigate('/');
        return;
    }

    const t = translations[getLang()];
    
    try {
        // Step 1: Load streams
        updateLoadingProgress(0, t.loadingStreams);
        const streams = await fetchStreams(token);
        appData.streams = streams;

        // Process categories
        const categories = {};
        const categoryNames = {};

        streams.sort((a, b) => a.num - b.num);
        streams.forEach(s => {
            if (!categories[s.category_id]) categories[s.category_id] = [];
            categories[s.category_id].push(s);
            if (!categoryNames[s.category_id]) {
                categoryNames[s.category_id] = s.name.replace(/✦●✦/g, '').trim();
            }
        });

        appData.categories = categories;
        appData.categoryNames = categoryNames;

        updateLoadingProgress(70, t.loadingStreams);

        // Step 2: Load account info
        updateLoadingProgress(70, t.loadingAccount);
        try {
            const accountInfo = await fetchAccountInfo(token);
            const storedCredentials = getStoredCredentials();
            appData.accountInfo = { ...accountInfo, ...storedCredentials };
            localStorage.setItem('user', JSON.stringify(appData.accountInfo));
        } catch (err) {
            console.warn('Failed to load account info:', err);
        }

        updateLoadingProgress(100, t.loadingApp);

        appData.loaded = true;

        // Hide loading screen and show dashboard
        setTimeout(() => {
            hideLoadingScreen();
            router.navigate('/dashboard');
        }, 300);

    } catch (err) {
        console.error('Failed to initialize app:', err);
        updateLoadingProgress(0, t.errorLoading);
        localStorage.removeItem('token');
        setTimeout(() => {
            hideLoadingScreen();
            router.navigate('/');
        }, 1500);
    }
}

export async function loginUser() {
    const dnsInput = document.getElementById('dns').value;
    const username = document.getElementById('user').value;
    const password = document.getElementById('pass').value;

    try {
        showLoadingScreen();
        const t = translations[getLang()];
        updateLoadingProgress(20, t.loading);

        const { res, data } = await loginRequest(dnsInput, username, password);

        if (res.ok) {
            localStorage.setItem('token', data.token);

            const urlObj = new URL(dnsInput.startsWith('http') ? dnsInput : `http://${dnsInput}`);
            saveStoredCredentials({
                dns: dnsInput,
                username,
                url: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80')
            });
            const userToCache = {
                ...data.user,
                url: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80')
            };

            localStorage.setItem('user', JSON.stringify(userToCache));
            
            await initApp();
        } else {
            hideLoadingScreen();
            alert('Login failed: ' + (data.error || 'Invalid credentials'));
        }
    } catch (err) {
        hideLoadingScreen();
        alert('Login failed: ' + err.message);
    }
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('xtream_credentials');
    setAppData({
        streams: [],
        categories: {},
        categoryNames: {},
        accountInfo: null,
        selectedCategory: null,
        loaded: false
    });
    router.navigate('/');
}
