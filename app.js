// ZeroTouch MicroPolicy App JavaScript
class ZeroTouchApp {
    constructor() {
        this.currentPage = 'home';
        this.selectedPolicy = null;
        this.userPolicies = JSON.parse(localStorage.getItem('zerotouch_policies') || '[]');
        this.arStepInterval = null;
        
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
        this.bindEvents();
        this.renderPolicies();
        this.updateDashboard();
        this.showPage('home');
        
        // Check for demo mode in URL
        if (window.location.pathname.includes('demo') || window.location.hash.includes('demo')) {
            this.showPage('demo');
        }
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                this.showPage(page);
            });
        });

        // Get started button
        document.getElementById('get-started-btn').addEventListener('click', () => {
            this.showPage('policies');
        });

        // AR continue button
        document.getElementById('continue-purchase-btn').addEventListener('click', () => {
            this.purchasePolicy();
        });

        // Demo triggers
        document.querySelectorAll('.demo-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventType = e.currentTarget.dataset.event;
                this.triggerDemoEvent(eventType);
            });
        });

        // Policy cards (will be bound after rendering)
        this.bindPolicyCards();
    }

    bindPolicyCards() {
        document.querySelectorAll('.policy-card').forEach(card => {
            card.addEventListener('click', () => {
                const policyId = parseInt(card.dataset.policyId);
                this.selectedPolicy = this.policies.find(p => p.id === policyId);
                this.showARExplainer();
            });
        });
    }

    showPage(pageId) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageId) {
                link.classList.add('active');
            }
        });

        // Update pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
        }

        // Page-specific actions
        if (pageId === 'dashboard') {
            this.updateDashboard();
        } else if (pageId === 'demo') {
            this.initDemoMode();
        }

        // Update URL without reloading
        window.history.pushState({}, '', `#${pageId}`);
    }

    renderPolicies() {
        const grid = document.getElementById('policies-grid');
        grid.innerHTML = '';

        this.policies.forEach(policy => {
            const card = document.createElement('div');
            card.className = 'policy-card';
            card.dataset.policyId = policy.id;
            
            card.innerHTML = `
                <div class="policy-header">
                    <div class="policy-icon">${policy.icon}</div>
                    <div class="policy-info">
                        <h3>${policy.name}</h3>
                        <div class="policy-price">₹${policy.price}</div>
                    </div>
                </div>
                <div class="policy-description">${policy.description}</div>
                <div class="policy-details">${policy.details}</div>
                <button class="btn btn--primary btn--full-width">Buy Now</button>
            `;

            grid.appendChild(card);
        });

        this.bindPolicyCards();
    }

    showARExplainer() {
        this.showPage('ar-explainer');
        
        // Update AR content
        document.getElementById('ar-policy-name').textContent = this.selectedPolicy.name;
        
        // Start AR simulation
        this.startARSimulation();
    }

    startARSimulation() {
        let currentStep = 1;
        const maxSteps = 4;
        
        // Reset AR steps
        document.querySelectorAll('.ar-step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelector('[data-step="1"]').classList.add('active');

        // Clear any existing interval
        if (this.arStepInterval) {
            clearInterval(this.arStepInterval);
        }

        // Progress through AR steps
        this.arStepInterval = setInterval(() => {
            currentStep++;
            if (currentStep <= maxSteps) {
                document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
            } else {
                clearInterval(this.arStepInterval);
            }
        }, 1500);
    }

    purchasePolicy() {
        if (!this.selectedPolicy) return;

        this.showLoading();

        // Simulate purchase process
        setTimeout(() => {
            const newPolicy = {
                id: `tx${Date.now()}`,
                policyName: this.selectedPolicy.name,
                status: 'Active',
                purchaseDate: new Date().toISOString(),
                eventTriggered: false,
                payout: null,
                blockchainHash: `0x${Math.random().toString(16).substr(2, 16)}`,
                price: this.selectedPolicy.price,
                icon: this.selectedPolicy.icon
            };

            this.userPolicies.push(newPolicy);
            localStorage.setItem('zerotouch_policies', JSON.stringify(this.userPolicies));
            
            this.hideLoading();
            this.showToast('Policy purchased successfully!', 'success');
            this.showPage('dashboard');
            this.selectedPolicy = null;
        }, 2000);
    }

    updateDashboard() {
        // Update stats
        document.getElementById('active-policies-count').textContent = this.userPolicies.length;
        
        const totalPayouts = this.userPolicies
            .filter(p => p.payout)
            .reduce((sum, p) => sum + (parseInt(p.payout.replace('₹', '')) || 0), 0);
        document.getElementById('total-payouts').textContent = `₹${totalPayouts}`;

        // Render policies list
        const container = document.getElementById('user-policies');
        
        if (this.userPolicies.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📋</span>
                    <h3>No Active Policies</h3>
                    <p>Get started by purchasing your first micro-policy</p>
                    <button class="btn btn--primary" onclick="app.showPage('policies')">Browse Policies</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.userPolicies.map(policy => `
            <div class="policy-item">
                <div class="policy-item-info">
                    <h4>${policy.icon} ${policy.policyName}</h4>
                    <div class="policy-item-meta">
                        Purchased: ${new Date(policy.purchaseDate).toLocaleDateString()}
                        <br>
                        Blockchain: ${policy.blockchainHash}
                    </div>
                </div>
                <div class="policy-item-status">
                    <span class="status-badge ${policy.status.toLowerCase()}">${policy.status}</span>
                    ${policy.payout ? `<div class="policy-payout">Payout: ${policy.payout}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    initDemoMode() {
        const demoLog = document.getElementById('demo-log');
        if (demoLog.children.length <= 1) { // Only placeholder
            demoLog.innerHTML = '<p class="demo-placeholder">Click buttons above to simulate events and see instant responses</p>';
        }
    }

    triggerDemoEvent(eventType) {
        const event = this.demoEvents.find(e => e.type === eventType);
        if (!event) return;

        this.showLoading();

        setTimeout(() => {
            this.hideLoading();
            this.addDemoLogEntry(event);
            
            if (eventType === 'fake') {
                this.showToast('Fraud attempt blocked!', 'error');
            } else {
                this.showToast(`Instant payout: ${event.payout}`, 'success');
                
                // Update a random user policy to show payout
                if (this.userPolicies.length > 0) {
                    const matchingPolicy = this.userPolicies.find(p => 
                        p.policyName === event.policyType && p.status === 'Active'
                    );
                    if (matchingPolicy) {
                        matchingPolicy.status = 'Paid Out';
                        matchingPolicy.payout = event.payout;
                        matchingPolicy.eventTriggered = true;
                        localStorage.setItem('zerotouch_policies', JSON.stringify(this.userPolicies));
                    }
                }
            }
        }, 1500);
    }

    addDemoLogEntry(event) {
        const demoLog = document.getElementById('demo-log');
        
        // Remove placeholder if it exists
        const placeholder = demoLog.querySelector('.demo-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const logEntry = document.createElement('div');
        logEntry.className = `demo-event ${event.type === 'fake' ? 'error' : 'success'}`;
        
        logEntry.innerHTML = `
            <div class="demo-event-header">
                <strong>${event.policyType}</strong>
                <span class="demo-event-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="demo-event-description">${event.description}</div>
            <div class="demo-event-payout ${event.type === 'fake' ? 'rejected' : ''}">${event.payout}</div>
        `;

        demoLog.insertBefore(logEntry, demoLog.firstChild);

        // Limit log entries to 10
        while (demoLog.children.length > 10) {
            demoLog.removeChild(demoLog.lastChild);
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 4000);
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('active');
    }
}

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Create a simple service worker inline
        const swCode = `
            const CACHE_NAME = 'zerotouch-v1';
            const urlsToCache = [
                '/',
                '/style.css',
                '/app.js'
            ];

            self.addEventListener('install', (event) => {
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then((cache) => cache.addAll(urlsToCache))
                );
            });

            self.addEventListener('fetch', (event) => {
                event.respondWith(
                    caches.match(event.request)
                        .then((response) => {
                            return response || fetch(event.request);
                        })
                );
            });
        `;

        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);

        navigator.serviceWorker.register(swUrl)
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ZeroTouchApp();
    
    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.substr(1);
        if (hash && ['home', 'policies', 'dashboard', 'demo', 'ar-explainer'].includes(hash)) {
            app.showPage(hash);
        }
    });
    
    // Handle initial hash
    const initialHash = window.location.hash.substr(1);
    if (initialHash) {
        app.showPage(initialHash);
    }
});

// Add some demo data for first-time visitors
document.addEventListener('DOMContentLoaded', () => {
    // Add a sample policy for demo purposes if none exist
    const existingPolicies = JSON.parse(localStorage.getItem('zerotouch_policies') || '[]');
    if (existingPolicies.length === 0) {
        const samplePolicies = [
            {
                id: 'tx001',
                policyName: 'Rain Delay Cover',
                status: 'Active',
                purchaseDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                eventTriggered: false,
                payout: null,
                blockchainHash: '0x1a2b3c4d5e6f7890',
                price: 10,
                icon: '🌧️'
            }
        ];
        localStorage.setItem('zerotouch_policies', JSON.stringify(samplePolicies));
    }
});

// Keyboard shortcuts for demo mode
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        app.showPage('demo');
    }
});

// Install prompt for PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
    
    // Show install button
    const installBtn = document.createElement('button');
    installBtn.className = 'btn btn--outline install-btn';
    installBtn.textContent = 'Install App';
    installBtn.style.position = 'fixed';
    installBtn.style.bottom = '20px';
    installBtn.style.right = '20px';
    installBtn.style.zIndex = '1000';
    
    installBtn.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            }
            deferredPrompt = null;
            installBtn.remove();
        });
    });
    
    document.body.appendChild(installBtn);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (installBtn.parentNode) {
            installBtn.remove();
        }
    }, 10000);
});

// Export for global access
window.ZeroTouchApp = ZeroTouchApp;