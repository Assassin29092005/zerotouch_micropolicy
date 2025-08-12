class DashboardManager {
    constructor(apiClient, utils) {
        this.apiClient = apiClient;
        this.utils = utils;
    }

    updateDashboard() {
        const activePoliciesCount = document.getElementById('active-policies-count');
        const totalCoverageEl = document.getElementById('total-coverage');
        const payoutsReceivedEl = document.getElementById('payouts-received');

        const userPolicies = window.policyManager.userPolicies;

        if (activePoliciesCount) {
            activePoliciesCount.textContent = userPolicies.filter(p => p.status === 'active').length;
        }
        
        if (totalCoverageEl) {
            const totalCoverage = userPolicies.reduce((sum, policy) => sum + policy.price, 0);
            totalCoverageEl.textContent = `₹${totalCoverage}`;
        }
        
        if (payoutsReceivedEl) {
            const payoutsReceived = userPolicies.filter(p => p.status === 'paid').reduce((sum, policy) => sum + policy.price, 0);
            payoutsReceivedEl.textContent = `₹${payoutsReceived}`;
        }

        this.renderUserPolicies(userPolicies);
    }

    renderUserPolicies(policies) {
        const listContainer = document.getElementById('user-policies-list');
        if (!listContainer) return;

        if (policies.length === 0) {
            listContainer.innerHTML = `
                <div class="placeholder">
                    <p>No policies yet. <a href="#" class="buy-first-policy-link">Buy your first policy</a></p>
                </div>
            `;
            const policyLink = listContainer.querySelector('.buy-first-policy-link');
            if (policyLink) {
                policyLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.navigationManager.showPage('policies');
                });
            }
        } else {
            listContainer.innerHTML = policies.map(policy => `
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

    async checkCustomerNotifications() {
        if (!window.authManager.isCustomerLoggedIn) return;
        
        try {
            const token = localStorage.getItem('zerotouch_customer_token');
            if (token === 'demo_token' || token === 'local_token') return;
            
            const { response, data } = await this.apiClient.getNotifications();

            if (data.success) {
                data.notifications.forEach(notification => {
                    if (notification.type === 'payout') {
                        this.utils.showToast(
                            `💰 ${notification.message}`, 
                            'success'
                        );
                    }
                });
                
                if (data.notifications.length > 0) {
                    window.policyManager.loadUserPolicies();
                }
            }
        } catch (error) {
            console.log('Could not check notifications (offline mode)');
        }
    }
}
