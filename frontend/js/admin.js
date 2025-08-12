class AdminManager {
    constructor(apiClient, utils) {
        this.apiClient = apiClient;
        this.utils = utils;
        
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
    }

    setupEventListeners() {
        // Demo events
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
