// GunnasTV - Translations
export const translations = {
    pt: {
        selectCategory: "Selecione uma categoria para começar a ver",
        noChannels: "Nenhum canal encontrado",
        errorLoading: "Erro ao carregar os dados.",
        fetching: "A carregar streams...",
        loading: "A carregar...",
        login: "Entrar",
        logout: "Sair",
        noInfo: "Sem informação",
        noEPGData: "Sem dados de programação disponíveis",
        now: "Agora",
        tomorrow: "Amanhã",
        loadingApp: "A carregar aplicação...",
        loadingStreams: "A carregar canais...",
        loadingAccount: "A carregar informação da conta...",
        days: {
            0: "Domingo",
            1: "Segunda",
            2: "Terça",
            3: "Quarta",
            4: "Quinta",
            5: "Sexta",
            6: "Sábado"
        }
    },
    en: {
        selectCategory: "Select a category to start watching",
        noChannels: "No channels found",
        errorLoading: "Error loading data.",
        fetching: "Fetching streams...",
        loading: "Loading...",
        login: "Login",
        logout: "Logout",
        noInfo: "No information",
        noEPGData: "No program guide data available",
        now: "Now",
        tomorrow: "Tomorrow",
        loadingApp: "Loading application...",
        loadingStreams: "Loading channels...",
        loadingAccount: "Loading account information...",
        days: {
            0: "Sunday",
            1: "Monday",
            2: "Tuesday",
            3: "Wednesday",
            4: "Thursday",
            5: "Friday",
            6: "Saturday"
        }
    }
};

export const getLang = () => localStorage.getItem('lang') || 'pt';

export function applyLanguage() {
    const lang = getLang();
    document.documentElement.lang = lang;
    
    document.querySelectorAll('[data-en]').forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (text) el.textContent = text;
    });
    
    document.querySelectorAll('[data-en-placeholder]').forEach(el => {
        const placeholder = el.getAttribute(`data-${lang}-placeholder`);
        if (placeholder) el.placeholder = placeholder;
    });
}
