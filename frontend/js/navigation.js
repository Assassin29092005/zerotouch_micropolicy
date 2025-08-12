class NavigationManager {
    constructor(utils) {
        this.utils = utils;
        this.currentPage = 'home';
    }

    setupEventListeners() {
        // Get Started button
        const getStartedBtn = document.getElementById('get-started-btn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                if (window.authManager.isCustomerLoggedIn) {
                    this.showPage('policies');
                } else {
                    this.showPage('customer-login');
                }
            });
        }

        // Regular navigation links
        document.querySelectorAll('[data-page]').forEach(btn => {
            const page = btn.getAttribute('data-page');
            if (!['demo', 'policies', 'dashboard'].includes(page)) {
                btn.addEventListener('click', (e) => {
                    this.showPage(page);
                });
            }
        });

        // Protected page navigation
        const policiesNavButton = document.querySelector('[data-page="policies"]');
        if (policiesNavButton) {
            policiesNavButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.authManager.isCustomerLoggedIn) {
                    this.showPage('policies');
                } else {
                    this.showPage('customer-login');
                    this.utils.showToast('Please login to access policies', 'warning');
                }
            });
        }

        const dashboardNavButton = document.querySelector('[data-page="dashboard"]');
        if (dashboardNavButton) {
            dashboardNavButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.authManager.isCustomerLoggedIn) {
                    this.showPage('dashboard');
                } else {
                    this.showPage('customer-login');
                    this.utils.showToast('Please login to access your dashboard', 'warning');
                }
            });
        }
    }

    showPage(pageName) {
        // Check access permissions
        if (['policies', 'dashboard', 'ar'].includes(pageName) && !window.authManager.isCustomerLoggedIn) {
            pageName = 'customer-login';
            this.utils.showToast('Please login to access this page', 'warning');
        }

        if (pageName === 'demo' && !window.authManager.isAdminLoggedIn) {
            pageName = 'admin-login';
            this.utils.showToast('Admin login required for demo access', 'warning');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const navLink = document.querySelector(`[data-page="${pageName}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }

        // Update pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        this.currentPage = pageName;

        // Special page actions
        if (pageName === 'dashboard') {
            window.dashboardManager.updateDashboard();
            window.dashboardManager.checkCustomerNotifications();
        }
    }
}
