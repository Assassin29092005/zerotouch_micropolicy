class AdminManager {
    constructor(apiClient, utils) {
        this.apiClient = apiClient;
        this.utils = utils;
        this.policyStats = {};
    }

    setupEventListeners() {
        // Admin signup form
        const adminSignupForm = document.getElementById('admin-signup-form');
        if (adminSignupForm) {
            adminSignupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminSignup();
            });
        }

        // Show signup/login toggles
        const showAdminSignup = document.getElementById('show-admin-signup');
        if (showAdminSignup) {
            showAdminSignup.addEventListener('click', (e) => {
                e.preventDefault();
                window.navigationManager.showPage('admin-signup');
            });
        }

        const showAdminLogin = document.getElementById('show-admin-login');
        if (showAdminLogin) {
            showAdminLogin.addEventListener('click', (e) => {
                e.preventDefault();
                window.navigationManager.showPage('admin-login');
            });
        }

        // Create new policy
        const createPolicyForm = document.getElementById('create-policy-form');
        if (createPolicyForm) {
            createPolicyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createNewPolicy();
            });
        }

        // Demo events (existing code)
        document.querySelectorAll('[data-event]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!window.authManager.isAdminLoggedIn) {
                    this.utils.showToast('Admin access required', 'error');
                    window.navigationManager.showPage('admin-login');
                    return;
                }
                const eventType = e.target.getAttribute('data-event');
                this.simulateEvent(eventType);
            });
        });
    }

    async handleAdminSignup() {
        const username = document.getElementById('admin-signup-username').value;
        const email = document.getElementById('admin-signup-email').value;
        const password = document.getElementById('admin-signup-password').value;
        const passkey = document.getElementById('admin-passkey').value;

        this.utils.clearFormErrors('admin-signup-form');

        if (!username || !email || !password || !passkey) {
            this.utils.showFormError('admin-signup-form', 'Please fill in all fields');
            return;
        }

        try {
            this.utils.showLoading();
            
            const { response, data } = await this.apiClient.request('/admin/signup', {
                method: 'POST',
                body: JSON.stringify({ username, email, password, passkey })
            });

            if (data.success) {
                this.utils.showToast('Admin account created successfully!', 'success');
                window.navigationManager.showPage('admin-login');
                document.getElementById('admin-signup-form').reset();
            } else {
                this.utils.showFormError('admin-signup-form', data.message);
                this.utils.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('Admin signup error:', error);
            this.utils.showFormError('admin-signup-form', 'Connection error. Please try again.');
            this.utils.showToast('Unable to create admin account', 'error');
        } finally {
            this.utils.hideLoading();
        }
    }

    async loadPolicyStats() {
        if (!window.authManager.isAdminLoggedIn) return;

        try {
            const { response, data } = await this.apiClient.request('/admin/policy-stats');

            if (data.success) {
                this.updatePolicyStatsDisplay(data.stats);
            }
        } catch (error) {
            console.error('Error loading policy stats:', error);
            // Fallback to local stats
            this.updatePolicyStatsDisplay([]);
        }
    }

    updatePolicyStatsDisplay(stats) {
        const policyTypes = [
            { name: 'Rain Delay Cover', elementId: 'rain-policy-count' },
            { name: 'Flight Delay Cover', elementId: 'flight-policy-count' },
            { name: 'Traffic Jam Cover', elementId: 'traffic-policy-count' },
            { name: 'Package Delay Cover', elementId: 'package-policy-count' }
        ];

        policyTypes.forEach(type => {
            const stat = stats.find(s => s._id === type.name);
            const element = document.getElementById(type.elementId);
            if (element) {
                element.textContent = stat ? stat.count : 0;
            }
        });
    }

    async createNewPolicy() {
        const name = document.getElementById('new-policy-name').value;
        const price = document.getElementById('new-policy-price').value;
        const description = document.getElementById('new-policy-description').value;
        const icon = document.getElementById('new-policy-icon').value;

        if (!name || !price || !description || !icon) {
            this.utils.showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            this.utils.showLoading();
            
            const { response, data } = await this.apiClient.request('/admin/policies/create', {
                method: 'POST',
                body: JSON.stringify({ name, price, description, icon })
            });

            if (data.success) {
                this.utils.showToast('New policy type created!', 'success');
                document.getElementById('create-policy-form').reset();
                window.policyManager.policies.push(data.policy);
                window.policyManager.renderPolicies();
            } else {
                this.utils.showToast(data.message, 'error');
            }
        } catch (error) {
            console.error('Create policy error:', error);
            this.utils.showToast('Error creating policy', 'error');
        } finally {
            this.utils.hideLoading();
        }
    }


    async simulateEvent(eventType) {
        if (!window.authManager.isAdminLoggedIn) {
            this.utils.showToast('Admin access required to trigger events', 'error');
            window.navigationManager.showPage('admin-login');
            return;
        }

        const event = this.demoEvents.find(e => e.type === eventType);
        if (!event) return;

        this.utils.showLoading();

        try {
            const { response, data } = await this.apiClient.simulateEvent({
                eventType: eventType,
                description: event.description,
                payout: event.payout
            });
            
            if (data.success) {
                const isSuccess = eventType !== 'fake';
                
                const logEntry = {
                    timestamp: new Date().toLocaleString(),
                    description: event.description,
                    policyType: event.policyType,
                    payout: isSuccess ? `₹${data.totalPayout} to ${data.affectedUsers} customers` : 'BLOCKED',
                    type: isSuccess ? 'success' : 'error',
                    triggeredBy: 'Admin',
                    details: isSuccess ? `${data.affectedUsers} users received payouts` : 'Fraud attempt detected'
                };

                this.addLogEntry(logEntry);
                
                if (isSuccess) {
                    if (data.affectedUsers > 0) {
                        this.utils.showToast(
                            `✅ Event processed! ${data.affectedUsers} customers received ₹${data.totalPayout} total payouts`, 
                            'success'
                        );
                    } else {
                        this.utils.showToast(
                            `⚠️ Event detected but no active policies found for ${event.policyType}`, 
                            'warning'
                        );
                    }
                } else {
                    this.utils.showToast('🚫 Fraud attempt blocked!', 'error');
                }
            }
        } catch (error) {
            console.error('Event simulation error:', error);
            
            const isSuccess = eventType !== 'fake';
            const logEntry = {
                timestamp: new Date().toLocaleString(),
                description: event.description + ' (Demo Mode)',
                policyType: event.policyType,
                payout: isSuccess ? '₹10 (Demo)' : 'BLOCKED',
                type: isSuccess ? 'success' : 'error',
                triggeredBy: 'Admin (Offline)',
                details: 'Backend not available - demo simulation'
            };

            this.addLogEntry(logEntry);
            
            if (isSuccess) {
                this.utils.showToast(`💰 Demo event triggered: ${event.payout}`, 'success');
            } else {
                this.utils.showToast('🚫 Fraud attempt blocked!', 'error');
            }
        } finally {
            this.utils.hideLoading();
        }
    }

    addLogEntry(entry) {
        const logEntries = document.getElementById('log-entries');
        if (!logEntries) return;

        const placeholder = logEntries.querySelector('.placeholder');
        if (placeholder) placeholder.remove();

        const entryElement = document.createElement('div');
        entryElement.className = `log-entry ${entry.type}`;
        entryElement.innerHTML = `
            <div class="timestamp">${entry.timestamp}${entry.triggeredBy ? ` - ${entry.triggeredBy}` : ''}</div>
            <div class="event-description">${entry.description}</div>
            <div class="payout-amount">${entry.payout}</div>
            ${entry.details ? `<div class="event-details">${entry.details}</div>` : ''}
        `;

        logEntries.insertBefore(entryElement, logEntries.firstChild);
    }
}
