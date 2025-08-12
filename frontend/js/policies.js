class PolicyManager {
    constructor(apiClient, utils) {
        this.apiClient = apiClient;
        this.utils = utils;
        this.selectedPolicy = null;
        this.userPolicies = [];
        
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
    }

    setupEventListeners() {
        // Policy selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.policy-card')) {
                if (!window.authManager.isCustomerLoggedIn) {
                    this.utils.showToast('Please login to purchase policies', 'warning');
                    window.navigationManager.showPage('customer-login');
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
    }

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
        window.navigationManager.showPage('ar');
        setTimeout(() => this.playARAnimation(), 500);
    }

    async loadUserPolicies() {
        if (!window.authManager.isCustomerLoggedIn) return;

        try {
            const { response, data } = await this.apiClient.getUserPolicies();

            if (data.success) {
                this.userPolicies = data.policies || [];
                window.dashboardManager.updateDashboard();
            }
        } catch (error) {
            console.error('Error loading policies:', error);
            this.userPolicies = JSON.parse(localStorage.getItem('zerotouch_policies') || '[]');
            window.dashboardManager.updateDashboard();
        }
    }

    async purchasePolicy() {
    if (!this.selectedPolicy || !window.authManager.isCustomerLoggedIn) return;

    this.utils.showLoading();

    try {
        const { response, data } = await this.apiClient.purchasePolicy({
            policyType: this.selectedPolicy.name,
            policyName: this.selectedPolicy.name,
            price: this.selectedPolicy.price
        });

        if (data.success) {
            this.utils.showToast('Policy purchased successfully!', 'success');
            await this.loadUserPolicies();         // Reload latest policies
            window.dashboardManager.updateDashboard();  // Refresh dashboard UI
            window.navigationManager.showPage('dashboard');
        } else {
            throw new Error('Purchase failed');
        }
    } catch (error) {
        // Fallback to localStorage for demo
        // After updating policies in localStorage:
        await this.loadUserPolicies();               // Ensure policies are reloaded
        window.dashboardManager.updateDashboard();  // Update dashboard
        this.utils.showToast('Policy purchased successfully!', 'success');
        window.navigationManager.showPage('dashboard');
    } finally {
        this.utils.hideLoading();
    }
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
}
