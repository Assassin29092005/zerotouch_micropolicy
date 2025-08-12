class APIClient {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost' ? 
            'http://localhost:5000/api' : '/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = localStorage.getItem('zerotouch_customer_token');
        
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            return { response, data };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async signup(userData) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async getProfile() {
        return this.request('/auth/profile');
    }

    // Policy endpoints
    async purchasePolicy(policyData) {
        return this.request('/policies/purchase', {
            method: 'POST',
            body: JSON.stringify(policyData)
        });
    }

    async getUserPolicies(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/policies/user${queryString ? '?' + queryString : ''}`);
    }

    async getNotifications() {
        return this.request('/policies/notifications');
    }

    // Admin endpoints
    async simulateEvent(eventData) {
        return this.request('/admin/simulate-event', {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
    }

    async getDashboardStats() {
        return this.request('/admin/dashboard/stats');
    }
}
