class AuthManager {
    constructor(apiClient, utils) {
        this.apiClient = apiClient;
        this.utils = utils;
        this.isCustomerLoggedIn = !!localStorage.getItem('zerotouch_customer_token');
        this.customerData = JSON.parse(localStorage.getItem('zerotouch_customer_data') || 'null');
        
        this.adminCredentials = {
            username: 'admin',
            password: 'zerotouch123'
        };
        this.isAdminLoggedIn = localStorage.getItem('zerotouch_admin_session') === 'true';
    }

    setupEventListeners() {
        // Customer login form
        const customerLoginForm = document.getElementById('customer-login-form');
        if (customerLoginForm) {
            customerLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCustomerLogin();
            });
        }

        // Customer signup form
        const customerSignupForm = document.getElementById('customer-signup-form');
        if (customerSignupForm) {
            customerSignupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCustomerSignup();
            });
        }

        // Admin login form
        const adminForm = document.getElementById('admin-login-form');
        if (adminForm) {
            adminForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        // Auth switch links
        const showSignupLink = document.getElementById('show-signup');
        if (showSignupLink) {
            showSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.navigationManager.showPage('customer-signup');
            });
        }

        const showLoginLink = document.getElementById('show-login');
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.navigationManager.showPage('customer-login');
            });
        }

        // Logout buttons
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (this.isCustomerLoggedIn) {
                    this.handleCustomerLogout();
                } else if (this.isAdminLoggedIn) {
                    this.handleAdminLogout();
                }
            });
        }

        const adminLogoutBtn = document.getElementById('admin-logout');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', () => {
                this.handleAdminLogout();
            });
        }
    }

    async handleCustomerLogin() {
        const email = document.getElementById('customer-email').value;
        const password = document.getElementById('customer-password').value;

        this.utils.clearFormErrors('customer-login-form');

        if (!email || !password) {
            this.utils.showFormError('customer-login-form', 'Please fill in all fields');
            return;
        }

        try {
            this.utils.showLoading();
            
            const { response, data } = await this.apiClient.login({ email, password });

            if (data.success) {
                this.isCustomerLoggedIn = true;
                localStorage.setItem('zerotouch_customer_token', data.token);
                localStorage.setItem('zerotouch_customer_data', JSON.stringify(data.user));
                this.customerData = data.user;

                this.updateCustomerUI();
                window.policyManager.loadUserPolicies();
                this.utils.showToast(`Welcome back, ${data.user.username}!`, 'success');
                window.navigationManager.showPage('dashboard');
                document.getElementById('customer-login-form').reset();
            } else {
                this.utils.showFormError('customer-login-form', data.message);
                this.utils.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            this.utils.showFormError('customer-login-form', 'Unable to connect to server. Please try again.');
            this.utils.showToast('Connection error. Please check your internet connection.', 'error');
        } finally {
            this.utils.hideLoading();
        }
    }

    async handleCustomerSignup() {
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        this.utils.clearFormErrors('customer-signup-form');

        if (!username || !email || !password || !confirmPassword) {
            this.utils.showFormError('customer-signup-form', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            this.utils.showFormError('customer-signup-form', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.utils.showFormError('customer-signup-form', 'Password must be at least 6 characters');
            return;
        }

        try {
            this.utils.showLoading();
            
            const { response, data } = await this.apiClient.signup({ username, email, password });

            if (data.success) {
                this.isCustomerLoggedIn = true;
                localStorage.setItem('zerotouch_customer_token', data.token);
                localStorage.setItem('zerotouch_customer_data', JSON.stringify(data.user));
                this.customerData = data.user;

                this.updateCustomerUI();
                this.utils.showToast(`Account created successfully! Welcome, ${data.user.username}!`, 'success');
                window.navigationManager.showPage('dashboard');
                document.getElementById('customer-signup-form').reset();
            } else {
                this.utils.showFormError('customer-signup-form', data.message);
                this.utils.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('❌ Signup error:', error);
            this.utils.showFormError('customer-signup-form', 'Unable to connect to server. Please try again.');
            this.utils.showToast('Connection error. Please check your internet connection.', 'error');
        } finally {
            this.utils.hideLoading();
        }
    }

    handleAdminLogin() {
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');
        
        if (!usernameInput || !passwordInput) return;

        const username = usernameInput.value;
        const password = passwordInput.value;

        this.utils.clearFormErrors('admin-login-form');

        if (username === this.adminCredentials.username && 
            password === this.adminCredentials.password) {
            
            this.isAdminLoggedIn = true;
            localStorage.setItem('zerotouch_admin_session', 'true');
            
            this.updateAdminUI();
            this.utils.showToast('Admin login successful!', 'success');
            window.navigationManager.showPage('demo');
            
            const form = document.getElementById('admin-login-form');
            if (form) form.reset();
            
        } else {
            this.utils.showFormError('admin-login-form', 'Invalid credentials. Please try again.');
            this.utils.showToast('Invalid admin credentials', 'error');
        }
    }

    handleCustomerLogout() {
        this.isCustomerLoggedIn = false;
        this.customerData = null;
        localStorage.removeItem('zerotouch_customer_token');
        localStorage.removeItem('zerotouch_customer_data');
        this.updateCustomerUI();
        this.utils.showToast('Logged out successfully', 'success');
        window.navigationManager.showPage('home');
    }

    handleAdminLogout() {
        this.isAdminLoggedIn = false;
        localStorage.removeItem('zerotouch_admin_session');
        this.updateAdminUI();
        this.utils.showToast('Admin logged out successfully', 'success');
        window.navigationManager.showPage('home');
    }

    updateCustomerUI() {
        const customerNavLink = document.getElementById('customer-nav-link');
        const logoutBtn = document.getElementById('logout-btn');
        const usernameDisplay = document.getElementById('username-display');
        const userWelcome = document.getElementById('user-welcome');

        if (this.isCustomerLoggedIn && this.customerData) {
            if (customerNavLink) customerNavLink.textContent = this.customerData.username;
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (usernameDisplay) usernameDisplay.textContent = this.customerData.username;
            if (userWelcome) userWelcome.style.display = 'block';
        } else {
            if (customerNavLink) customerNavLink.textContent = 'Login';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userWelcome) userWelcome.style.display = 'none';
        }
    }

    updateAdminUI() {
        const adminNavLink = document.getElementById('admin-nav-link');
        const adminUserDisplay = document.getElementById('admin-user-display');

        if (this.isAdminLoggedIn) {
            if (adminNavLink) adminNavLink.textContent = 'Demo Control';
            if (adminUserDisplay) adminUserDisplay.textContent = 'Admin';
        } else {
            if (adminNavLink) adminNavLink.textContent = 'Admin';
        }
    }
}
