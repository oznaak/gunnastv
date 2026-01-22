// GunnasTV - SPA Router
import { applyLanguage } from './translations.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderAccountView } from './ui/account.js';
import { renderEPGView } from './ui/epg.js';
import { appData } from './config.js';

export const router = {
    currentView: null,
    routes: {
        '/': 'login',
        '/dashboard': 'dashboard',
        '/account': 'account',
        '/epg': 'epg'
    },

    init() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
                this.showView(e.state.view, false);
            }
        });

        // Determine initial route
        const path = window.location.pathname;
        const view = this.routes[path] || 'login';
        
        // Check if user is logged in
        const isAuthenticated = !!localStorage.getItem('token');
        
        if (isAuthenticated && view === 'login') {
            // Don't navigate yet - let initApp handle it after loading data
            return;
        } else if (!isAuthenticated && view !== 'login') {
            this.navigate('/');
        } else if (!isAuthenticated) {
            this.showView(view, false);
        }
    },

    navigate(path) {
        const view = this.routes[path];
        if (view) {
            history.pushState({ view }, '', path);
            this.showView(view, true);
        }
    },

    showView(viewName, animate = true) {
        const newView = document.querySelector(`[data-view="${viewName}"]`);
        const oldView = document.querySelector('.view-container.active');
        const navbar = document.getElementById('globalNavbar');

        if (!newView) return;
        if (oldView === newView) return;

        // Show/hide navbar based on view
        if (viewName === 'login') {
            if (navbar) navbar.style.display = 'none';
        } else {
            if (navbar) navbar.style.display = 'flex';
        }

        // Update active nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            const route = link.getAttribute('data-route');
            if (route === viewName) {
                link.classList.remove('text-gray-300');
                link.classList.add('text-white');
            } else {
                link.classList.add('text-gray-300');
                link.classList.remove('text-white');
            }
        });

        if (!animate || !oldView) {
            // No animation - just show
            if (oldView) {
                oldView.classList.remove('active');
                oldView.style.display = 'none';
            }
            newView.style.display = 'block';
            newView.classList.add('active');
            this.currentView = viewName;
            this.onViewChanged(viewName);
        } else {
            // Animated transition
            const direction = this.getDirection(this.currentView, viewName);
            
            oldView.classList.add(direction === 'forward' ? 'exit-right' : 'exit-left');
            newView.style.display = 'block';
            newView.classList.add('active', direction === 'forward' ? 'slide-from-right' : 'slide-from-left');

            setTimeout(() => {
                oldView.classList.remove('active', 'exit-left', 'exit-right');
                oldView.style.display = 'none';
                newView.classList.remove('slide-from-right', 'slide-from-left');
            }, 300);

            this.currentView = viewName;
            this.onViewChanged(viewName);
        }
    },

    getDirection(from, to) {
        const order = ['login', 'dashboard', 'epg', 'account'];
        const fromIndex = order.indexOf(from);
        const toIndex = order.indexOf(to);
        return toIndex > fromIndex ? 'forward' : 'backward';
    },

    onViewChanged(viewName) {
        if (viewName === 'dashboard' && appData.loaded) {
            renderDashboard();
        } else if (viewName === 'account') {
            renderAccountView();
        } else if (viewName === 'epg') {
            renderEPGView();
        }
        applyLanguage();
    }
};
