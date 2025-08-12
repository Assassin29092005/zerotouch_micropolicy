class ZeroTouchApp {
    constructor() {
        this.init();
    }

    init() {
        // Initialize utilities and API client
        window.utils = new Utils();
        window.apiClient = new APIClient();

        // Initialize managers
        window.authManager = new AuthManager(window.apiClient, window.utils);
        window.policyManager = new PolicyManager(window.apiClient, window.utils);
        window.dashboardManager = new DashboardManager(window.apiClient, window.utils);
        window.adminManager = new AdminManager(window.apiClient, window.utils);
        window.navigationManager = new NavigationManager(window.utils);

        // Setup all event listeners
        this.setupEventListeners();

        // Initial UI setup
        window.authManager.updateCustomerUI();
        window.authManager.updateAdminUI();
        window.policyManager.renderPolicies();

        // Load user policies if logged in
        if (window.authManager.isCustomerLoggedIn) {
            window.policyManager.loadUserPolicies();
        }

        // Start on home page
        window.navigationManager.showPage('home');
    }

    setupEventListeners() {
        window.authManager.setupEventListeners();
        window.policyManager.setupEventListeners();
        window.adminManager.setupEventListeners();
        window.navigationManager.setupEventListeners();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ZeroTouchApp();
});
