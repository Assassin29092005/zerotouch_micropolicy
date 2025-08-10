// ZeroTouch MicroPolicy App JavaScript
class ZeroTouchApp {
    constructor() {
        this.currentPage = 'home';
        this.selectedPolicy = null;
        this.userPolicies = [];
        this.arStepInterval = null;
        this.isAdminLoggedIn = localStorage.getItem('zerotouch_admin_session') === 'true';
        this.isCustomerLoggedIn = !!localStorage.getItem('zerotouch_customer_token');
        this.customerData = JSON.parse(localStorage.getItem('zerotouch_customer_data') || 'null');
        this.apiBaseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
        
        this.adminCredentials = {
            username: 'admin',
            password: 'zerotouch123'
        };
        
        // Policy data
        this.policies = [
            {
                id: 1,
                name: "Rain Delay Cover",
                price: 10,
                description: "Pays if rain >10mm in 2h",
                details: "Get instant payout if rainfall exceeds 10mm within 2 hours of policy activation. Perfect for outdoor events, travel, or commutes.",
                icon: "🌧️"
            },
            {
                id: 2,
                name: "Flight Delay Cover",
                price: 25,
                description: "Pays if flight delayed >2h",
                details: "Automatic compensation when your flight is delayed more than 2 hours. No forms, no waiting - just instant relief.",
                icon: "✈️"
            },
            {
                id: 3,
                name: "Traffic Jam Cover",
                price: 5,
                description: "Pays if stuck in traffic >30min",
                details: "Smart coverage for unexpected traffic delays. Get paid when you're stuck in traffic for more than 30 minutes.",
                icon: "🚗"
            },
            {
                id: 4,
                name: "Package Delay Cover",
                price: 15,
                description: "Pays if delivery delayed >1 day",
                details: "Protect important deliveries. Get instant compensation if your package arrives more than 1 day late.",
                icon: "📦"
            }
        ];

        this.demoEvents = [
            {
                type: "rain",
                description: "Heavy rainfall detected: 15mm in last hour",
                policyType: "Rain Delay Cover",
                payout: "₹10"
            },
            {
                type: "flight",
                description: "Flight AI-101 delayed by 3 hours",
                policyType: "Flight Delay Cover",
                payout: "₹25"
            },
            {
                type: "traffic",
                description: "Traffic jam on route: 45 minutes delay",
                policyType: "Traffic Jam Cover",
                payout: "₹5"
            },
            {
                type: "fake",
                description: "Manual claim attempt detected",
                policyType: "Any",
                payout: "REJECTED - No official event detected"
            }
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderPolicies();
        this.updateCustomerUI();
        this.updateAdminUI();
        if (this.isCustomerLoggedIn) {
            this.loadUserPolicies();
        }
        this.showPage('home');
    }

    setupEventListeners() {
        // Get Started button - FIXED
        const getStartedBtn = document.getElementById('get-started-btn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                if (this.isCustomerLoggedIn) {
                    this.showPage('policies');
                } else {
                    this.showPage('customer-login');
                }
            });
        }

        // Navigation - regular pages
        document.querySelectorAll('[data-page]').forEach(btn => {
            if (!['demo', 'policies'].includes(btn.getAttribute('data-page'))) {
                btn.addEventListener('click', (e) => {
                    const page = e.target.getAttribute('data-page');
                    this.showPage(page);
                });
            }
        });

        // Special handling for policies page
        const policiesNavButton = document.querySelector('[data-page="policies"]');
        if (policiesNavButton) {
            policiesNavButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.isCustomerLoggedIn) {
                    this.showPage('policies');
                } else {
                    this.showPage('customer-login');
                    this.showToast('Please login to access policies', 'warning');
                }
            });
        }

        // Special handling for dashboard page
        const dashboardNavButton = document.querySelector('[data-page="dashboard"]');
        if (dashboardNavButton) {
            dashboardNavButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.isCustomerLoggedIn) {
                    this.showPage('dashboard');
                } else {
                    this.showPage('customer-login');
                    this.showToast('Please login to access your dashboard', 'warning');
                }
            });
        }

        // Special handling for demo page access
        const demoNavButton = document.querySelector('[data-page="demo"]');
        if (demoNavButton) {
            demoNavButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.isAdminLoggedIn) {
                    this.showPage('demo');
                } else {
                    this.showPage('admin-login');
                    this.showToast('Please login as admin to access demo controls', 'warning');
                }
            });
        }

        // Customer authentication forms
        const customerLoginForm = document.getElementById('customer-login-form');
        if (customerLoginForm) {
            customerLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCustomerLogin();
            });
        }

        const customerSignupForm = document.getElementById('customer-signup-form');
        if (customerSignupForm) {
            customerSignupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCustomerSignup();
            });
        }

        // Auth switch links
        const showSignupLink = document.getElementById('show-signup')?.addEventListener('click', (e) => {e.preventDefault();
                                this.showPage('customer-signup');
});

        if (showSignupLink) {
            showSignupLink.addEventListener('click', (e) => {
                e.preventDefault();  // Prevent default anchor navigation
                appInstance.showPage('customer-signup'); // Replace appInstance with your app object name
            });
        }


        const showLoginLink = document.getElementById('show-login');
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage('customer-login');
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

        // Policy selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.policy-card')) {
                if (!this.isCustomerLoggedIn) {
                    this.showToast('Please login to purchase policies', 'warning');
                    this.showPage('customer-login');
                    return;
                }
                const policyId = parseInt(e.target.closest('.policy-card').getAttribute('data-policy-id'));
                this.selectPolicy(policyId);
            }
        });

        // AR controls
        const arReplayBtn = document.getElementById('ar-replay');
        if (arReplayBtn) {
            arReplayBtn.addEventListener('click', () => {
                this.playARAnimation();
            });
        }

        const arContinueBtn = document.getElementById('ar-continue');
        if (arContinueBtn) {
            arContinueBtn.addEventListener('click', () => {
                this.purchasePolicy();
            });
        }

        // Demo events - with admin protection
        document.querySelectorAll('[data-event]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isAdminLoggedIn) {
                    this.showToast('Admin access required', 'error');
                    this.showPage('admin-login');
                    return;
                }
                const eventType = e.target.getAttribute('data-event');
                this.simulateEvent(eventType);
            });
        });
    }

    // Customer Authentication Methods
    async handleCustomerLogin() {
        const email = document.getElementById('customer-email').value;
        const password = document.getElementById('customer-password').value;

        this.clearFormErrors('customer-login-form');

        try {
            this.showLoading();
            const response = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.isCustomerLoggedIn = true;
                localStorage.setItem('zerotouch_customer_token', data.token);
                localStorage.setItem('zerotouch_customer_data', JSON.stringify(data.user));
                this.customerData = data.user;

                this.updateCustomerUI();
                this.loadUserPolicies();
                this.showToast('Login successful!', 'success');
                this.showPage('dashboard');
                document.getElementById('customer-login-form').reset();
            } else {
                this.showFormError('customer-login-form', data.message);
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
            console.error('Login error:', error);
        } finally {
            this.hideLoading();
        }
    }

    async handleCustomerSignup() {
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        this.clearFormErrors('customer-signup-form');

        // Validate passwords match
        if (password !== confirmPassword) {
            this.showFormError('customer-signup-form', 'Passwords do not match');
            return;
        }

        try {
            this.showLoading();
            const response = await fetch(`${this.apiBaseUrl}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.isCustomerLoggedIn = true;
                localStorage.setItem('zerotouch_customer_token', data.token);
                localStorage.setItem('zerotouch_customer_data', JSON.stringify(data.user));
                this.customerData = data.user;

                this.updateCustomerUI();
                this.showToast('Account created successfully!', 'success');
                this.showPage('dashboard');
                document.getElementById('customer-signup-form').reset();
            } else {
                this.showFormError('customer-signup-form', data.message);
                this.showToast(data.message, 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
            console.error('Signup error:', error);
        } finally {
            this.hideLoading();
        }
    }

    handleCustomerLogout() {
        this.isCustomerLoggedIn = false;
        this.customerData = null;
        this.userPolicies = [];
        localStorage.removeItem('zerotouch_customer_token');
        localStorage.removeItem('zerotouch_customer_data');
        this.updateCustomerUI();
        this.showToast('Logged out successfully', 'success');
        this.showPage('home');
    }

    async loadUserPolicies() {
        if (!this.isCustomerLoggedIn) return;

        try {
            const token = localStorage.getItem('zerotouch_customer_token');
            const response = await fetch(`${this.apiBaseUrl}/api/policies/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const policies = await response.json();
                this.userPolicies = policies;
                this.updateDashboard();
            }
        } catch (error) {
            console.error('Error loading policies:', error);
            // Fallback to localStorage for demo
            this.userPolicies = JSON.parse(localStorage.getItem('zerotouch_policies') || '[]');
        }
    }

    async purchasePolicy() {
        if (!this.selectedPolicy || !this.isCustomerLoggedIn) return;

        this.showLoading();

        try {
            const token = localStorage.getItem('zerotouch_customer_token');
            const response = await fetch(`${this.apiBaseUrl}/api/policies/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    policyType: this.selectedPolicy.name,
                    policyName: this.selectedPolicy.name,
                    price: this.selectedPolicy.price
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.showToast('Policy purchased successfully!', 'success');
                this.loadUserPolicies(); // Reload policies
                this.showPage('dashboard');
            } else {
                throw new Error('Purchase failed');
            }
        } catch (error) {
            // Fallback to local storage for demo
            const policy = {
                _id: Date.now(),
                ...this.selectedPolicy,
                userId: this.customerData?.id,
                purchaseDate: new Date().toISOString(),
                status: 'active',
                blockchainHash: this.generateBlockchainHash()
            };

            this.userPolicies.push(policy);
            localStorage.setItem('zerotouch_policies', JSON.stringify(this.userPolicies));
            this.showToast('Policy purchased successfully!', 'success');
            this.showPage('dashboard');
        } finally {
            this.hideLoading();
        }
    }

    updateCustomerUI() {
        const customerNavLink = document.getElementById('customer-nav-link');
        const logoutBtn = document.getElementById('logout-btn');
        const usernameDisplay = document.getElementById('username-display');
        const userWelcome = document.getElementById('user-welcome');

        if (this.isCustomerLoggedIn && this.customerData) {
            // Show user info
            if (customerNavLink) customerNavLink.textContent = this.customerData.username;
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (usernameDisplay) usernameDisplay.textContent = this.customerData.username;
            if (userWelcome) userWelcome.style.display = 'block';
        } else {
            // Show login link
            if (customerNavLink) customerNavLink.textContent = 'Login';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userWelcome) userWelcome.style.display = 'none';
        }
    }

    // Form Helper Methods
    showFormError(formId, message) {
        const form = document.getElementById(formId);
        if (!form) return;

        const existingError = form.querySelector('.error-message');
        if (existingError) existingError.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        form.appendChild(errorDiv);
    }

    clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.remove());
    }

    showPage(pageName) {
        // Check customer access for protected pages
        if (['policies', 'dashboard', 'ar'].includes(pageName) && !this.isCustomerLoggedIn) {
            pageName = 'customer-login';
            this.showToast('Please login to access this page', 'warning');
        }

        // Check admin access for demo page
        if (pageName === 'demo' && !this.isAdminLoggedIn) {
            pageName = 'admin-login';
            this.showToast('Admin login required for demo access', 'warning');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Find the correct nav link to activate
        const navLink = document.querySelector(`[data-page="${pageName}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }

        // Update pages
        document.querySelectorAll('.page').forEach(page =>page.classList.remove('active'));
        document.getElementById(`${pageName}-page`)?.classList.add('active');
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        this.currentPage = pageName;

        // Special actions for certain pages
        if (pageName === 'dashboard') {
            this.updateDashboard();
        }
    }

    // Admin Authentication (existing methods)
    handleAdminLogin() {
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');
        
        if (!usernameInput || !passwordInput) return;

        const username = usernameInput.value;
        const password = passwordInput.value;

        this.clearFormErrors('admin-login-form');

        if (username === this.adminCredentials.username && 
            password === this.adminCredentials.password) {
            
            this.isAdminLoggedIn = true;
            localStorage.setItem('zerotouch_admin_session', 'true');
            
            this.updateAdminUI();
            this.showToast('Admin login successful!', 'success');
            this.showPage('demo');
            
            const form = document.getElementById('admin-login-form');
            if (form) form.reset();
            
        } else {
            this.showFormError('admin-login-form', 'Invalid credentials. Please try again.');
            this.showToast('Invalid admin credentials', 'error');
        }
    }

    handleAdminLogout() {
        this.isAdminLoggedIn = false;
        localStorage.removeItem('zerotouch_admin_session');
        this.updateAdminUI();
        this.showToast('Admin logged out successfully', 'success');
        this.showPage('home');
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

    // Existing methods (renderPolicies, selectPolicy, etc.)
    renderPolicies() {
        const grid = document.getElementById('policies-grid');
        if (!grid) return;

        grid.innerHTML = this.policies.map(policy => `
            <div class="policy-card" data-policy-id="${policy.id}">
                <div class="policy-header">
                    <span class="policy-icon">${policy.icon}</span>
                    <span class="policy-name">${policy.name}</span>
                </div>
                <div class="policy-price">₹${policy.price}</div>
                <div class="policy-description">${policy.description}</div>
                <div class="policy-details">${policy.details}</div>
                <button class="btn btn-primary">Buy Now</button>
            </div>
        `).join('');
    }

    selectPolicy(policyId) {
        this.selectedPolicy = this.policies.find(p => p.id === policyId);
        this.showPage('ar');
        setTimeout(() => this.playARAnimation(), 500);
    }

    playARAnimation() {
        const steps = document.querySelectorAll('.ar-step');
        steps.forEach(step => step.classList.remove('active'));

        let currentStep = 0;
        const animateStep = () => {
            if (currentStep < steps.length) {
                steps[currentStep].classList.add('active');
                currentStep++;
                setTimeout(animateStep, 1500);
            }
        };

        animateStep();
    }

    updateDashboard() {
        // Update stats
        const activePoliciesCount = document.getElementById('active-policies-count');
        const totalCoverageEl = document.getElementById('total-coverage');
        const payoutsReceivedEl = document.getElementById('payouts-received');

        if (activePoliciesCount) {
            activePoliciesCount.textContent = this.userPolicies.filter(p => p.status === 'active').length;
        }
        
        if (totalCoverageEl) {
            const totalCoverage = this.userPolicies.reduce((sum, policy) => sum + policy.price, 0);
            totalCoverageEl.textContent = `₹${totalCoverage}`;
        }
        
        if (payoutsReceivedEl) {
            const payoutsReceived = this.userPolicies.filter(p => p.status === 'paid').reduce((sum, policy) => sum + policy.price, 0);
            payoutsReceivedEl.textContent = `₹${payoutsReceived}`;
        }

        // Update policies list
        const listContainer = document.getElementById('user-policies-list');
        if (!listContainer) return;

        if (this.userPolicies.length === 0) {
            listContainer.innerHTML = `
                <div class="placeholder">
                    <p>No policies yet. <a href="#" class="buy-first-policy-link">Buy your first policy</a></p>
                </div>
            `;
            // Re-attach event listener for the link
            const policyLink = listContainer.querySelector('.buy-first-policy-link');
            if (policyLink) {
                policyLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showPage('policies');
                });
            }
        } else {
            listContainer.innerHTML = this.userPolicies.map(policy => `
                <div class="user-policy-card">
                    <div class="policy-info">
                        <h3>${policy.icon || '📋'} ${policy.policyName || policy.name}</h3>
                        <span class="policy-status ${policy.status}">${policy.status.toUpperCase()}</span>
                        <p>Blockchain: ${policy.blockchainHash}</p>
                        <p>Purchased: ${new Date(policy.purchaseDate).toLocaleDateString()}</p>
                    </div>
                    <div class="policy-price">₹${policy.price}</div>
                </div>
            `).join('');
        }
    }

    simulateEvent(eventType) {
        if (!this.isAdminLoggedIn) {
            this.showToast('Admin access required to trigger events', 'error');
            this.showPage('admin-login');
            return;
        }

        const event = this.demoEvents.find(e => e.type === eventType);
        if (!event) return;

        this.showLoading();

        setTimeout(() => {
            this.hideLoading();
            
            const isSuccess = eventType !== 'fake';
            const logEntry = {
                timestamp: new Date().toLocaleString(),
                description: event.description,
                policyType: event.policyType,
                payout: event.payout,
                type: isSuccess ? 'success' : 'error',
                triggeredBy: 'Admin'
            };

            this.addLogEntry(logEntry);
            
            if (isSuccess) {
                this.showToast(`Event detected! ${event.payout} paid instantly`, 'success');
                // Update a policy status if exists
                if (this.userPolicies.length > 0) {
                    const activePolicy = this.userPolicies.find(p => p.status === 'active');
                    if (activePolicy) {
                        activePolicy.status = 'paid';
                        localStorage.setItem('zerotouch_policies', JSON.stringify(this.userPolicies));
                        this.updateDashboard();
                    }
                }
            } else {
                this.showToast('Fraud attempt blocked!', 'error');
            }
        }, 1500);
    }

    addLogEntry(entry) {
        const logEntries = document.getElementById('log-entries');
        if (!logEntries) return;

        const placeholder = logEntries.querySelector('.placeholder');
        if (placeholder) placeholder.remove();

        const entryElement = document.createElement('div');
        entryElement.className = `log-entry ${entry.type}`;
        entryElement.innerHTML = `
            <div class="timestamp">${entry.timestamp}${entry.triggeredBy ? ` - Triggered by ${entry.triggeredBy}` : ''}</div>
            <div class="event-description">${entry.description}</div>
            <div class="payout-amount">${entry.payout}</div>
        `;

        logEntries.insertBefore(entryElement, logEntries.firstChild);
    }

    showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }

    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-message">${message}</div>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 4000);
    }

    generateBlockchainHash() {
        return '0x' + Math.random().toString(16).substr(2, 16);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ZeroTouchApp();
});
