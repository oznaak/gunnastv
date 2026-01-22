// GunnasTV - Account View
import { appData } from '../config.js';
import { getStoredCredentials, escapeHtml } from '../utils.js';
import { getLang, applyLanguage } from '../translations.js';
import { exportFavorites, importFavorites } from '../favorites.js';

export function renderAccountView() {
    const container = document.getElementById('accountContainer');
    const storedCredentials = getStoredCredentials();
    const user = { ...(appData.accountInfo || {}), ...(JSON.parse(localStorage.getItem('user') || '{}')), ...storedCredentials };
    const lang = getLang();
    const dnsValue = `${user.url || '--'}:${user.port || '--'}`;
    const safeDns = escapeHtml(dnsValue);
    const safeUsername = escapeHtml(user.username || '--');
    const safeStatus = escapeHtml(user.status || '--');

    container.innerHTML = `
        <h1 class="text-xl mb-4" data-en="Account" data-pt="Conta"></h1>
        
        <div class="pb-3 border-b border-gray-700">
            <div class="text-gray-400 text-sm mb-2" data-en="Display Language" data-pt="Idioma de exibição"></div>
            <div class="relative w-max">
                <div onclick="window.toggleLangDropdown()" class="flex items-center gap-2.5 bg-gray-700/50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-700 transition">
                    <img id="currentFlag" src="assets/${lang === 'pt' ? 'pt_flag.png' : 'gb_flag.png'}" class="h-4 w-auto object-contain" />
                    <span id="currentLangText" class="text-sm">${lang === 'pt' ? 'Português' : 'English'}</span>
                    <span class="text-xs text-gray-400">▼</span>
                </div>
                <div id="langDropdown" class="absolute left-0 mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl hidden z-50 overflow-hidden">
                    <div onclick="window.setLanguage('pt')" class="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-600 cursor-pointer text-sm">
                        <img src="assets/pt_flag.png" class="h-3.5 w-auto object-contain" /> Português
                    </div>
                    <div onclick="window.setLanguage('en')" class="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-600 cursor-pointer text-sm">
                        <img src="assets/gb_flag.png" class="h-3.5 w-auto object-contain" /> English
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 gap-3.5 pt-2">
            <div>
                <div class="text-gray-400 text-sm font-medium mb-1.5" data-en="Server" data-pt="Servidor">Server</div>
                 <div class="sensitive-field" 
                     data-value="${safeDns}"
                     onclick="window.toggleSensitiveData(this, this.dataset.value)" 
                     data-visible="false">
                  <span class="value">••••••••••••</span>
                  <span class="icon">👁</span>
                </div>
                <div class="helper-text" data-en="Click to reveal" data-pt="Clica para revelar"></div>
            </div>
            <div>
                <div class="text-gray-400 text-sm font-medium mb-1.5" data-en="Username" data-pt="Utilizador"></div>
                     <div class="sensitive-field" 
                            data-value="${safeUsername}"
                            onclick="window.toggleSensitiveData(this, this.dataset.value)" 
                            data-visible="false">
                        <span class="value">${'*'.repeat(Math.min(user.username?.length || 0, 12))}</span>
                  <span class="icon">👁</span>
                </div>
                <div class="helper-text" data-en="Click to reveal" data-pt="Clica para revelar"></div>
            </div>
            <div class="flex gap-10">
                <div>
                    <div class="text-gray-400 text-sm" data-en="Status" data-pt="Estado"></div>
                    <div id="accStatus" class="${user.status === 'Active' ? 'text-green-400' : 'text-red-400'} text-sm">${safeStatus}</div>
                </div>
                <div>
                    <div class="text-gray-400 text-sm" data-en="Expiration date" data-pt="Data de validade"></div>
                    <div id="accExp" class="text-sm">${user.exp_date ? new Date(Number(user.exp_date) * 1000).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB') : 'N/A'}</div>
                </div>
            </div>
            <div class="flex gap-10">
                <div>
                    <div class="text-gray-400 text-sm" data-en="Active connections" data-pt="Ligações ativas"></div>
                    <div id="accActiveCons" class="text-sm">${user.active_cons || 0}</div>
                </div>
                <div>
                    <div class="text-gray-400 text-sm" data-en="Max connections" data-pt="Limite de ligações"></div>
                    <div id="accMaxCons" class="text-sm">${user.max_connections || 0}</div>
                </div>
            </div>

            <div class="favorites-section">
                <h3 class="text-base font-semibold mb-2.5" data-en="Manage Favorites" data-pt="Gerenciar Favoritos"></h3>
                <p class="text-gray-400 text-sm mb-3" data-en="Export and import your favorite channels and categories" data-pt="Exporte e importe seus canais e categorias favoritos"></p>
                <div class="flex gap-3 flex-wrap">
                    <button class="action-btn" onclick="window.exportFavoritesHandler()" data-en="Export Favorites" data-pt="Exportar Favoritos"></button>
                    <button class="action-btn secondary" onclick="document.getElementById('favoriteFileInput').click()" data-en="Import Favorites" data-pt="Importar Favoritos"></button>
                </div>
            </div>
        </div>
    `;
    
    applyLanguage();
}

window.toggleLangDropdown = function() {
    const dropdown = document.getElementById('langDropdown');
    dropdown.classList.toggle('hidden');
};

window.setLanguage = function(lang) {
    localStorage.setItem('lang', lang);
    renderAccountView();
};

window.toggleSensitiveData = function(element, realValue) {
    const valueSpan = element.querySelector('.value');
    const isVisible = element.getAttribute('data-visible') === 'true';
    const helperText = element.nextElementSibling;
    const lang = getLang();
    
    if (isVisible) {
        valueSpan.textContent = realValue.length <= 12 ? '*'.repeat(realValue.length) : '*'.repeat(12);
        element.setAttribute('data-visible', 'false');
        element.classList.remove('visible');
        if (helperText) {
            helperText.setAttribute('data-en', 'Click to reveal');
            helperText.setAttribute('data-pt', 'Clica para revelar');
            helperText.textContent = lang === 'en' ? 'Click to reveal' : 'Clica para revelar';
        }
    } else {
        valueSpan.textContent = realValue;
        element.setAttribute('data-visible', 'true');
        element.classList.add('visible');
        if (helperText) {
            helperText.setAttribute('data-en', 'Click to hide');
            helperText.setAttribute('data-pt', 'Clica para esconder');
            helperText.textContent = lang === 'en' ? 'Click to hide' : 'Clica para esconder';
        }
    }
};

window.exportFavoritesHandler = function() {
    exportFavorites();
    const lang = getLang();
    const message = lang === 'en' ? 'Favorites exported successfully!' : 'Favoritos exportados com sucesso!';
    showToast(message, 'success');
};

window.importFavoritesHandler = function(event) {
    const file = event.target.files[0];
    const lang = getLang();
    
    if (!file) return;

    importFavorites(file).then(result => {
        const message = lang === 'en' ? 'Favorites imported successfully!' : 'Favoritos importados com sucesso!';
        showToast(message, 'success');
    }).catch(error => {
        const message = lang === 'en' ? 'Error: ' + error.message : 'Erro: ' + error.message;
        showToast(message, 'error');
    });

    event.target.value = '';
};

export function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : '⚠';
    const safeMessage = escapeHtml(message);
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${safeMessage}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('exit');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
