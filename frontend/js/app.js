// Path: frontend/js/app.js
// Main Application Controller (and global entry point)
import { authManager } from "./auth.js"
import { policyManager } from "./policies.js"
import { onboardingManager } from "./onboarding.js"
import { adminManager } from "./admin.js"
import * as utils from "./utils.js"
import { supabase } from "./supabaseClient.js"

// --- Global Navigation Functions (Now use window.location.href) ---
function showLanding() { window.location.href = "index.html" }
function showLogin() { window.location.href = "login.html" }
function showSignup() { window.location.href = "signup.html" }
function showAdminLogin() { window.location.href = "admin-login.html" } // New admin login page
function showAdminSignup() { window.location.href = "admin-signup.html" }
function showDashboard() {
  if (authManager.isAdmin()) {
    window.location.href = "admin-dashboard.html"
  } else {
    window.location.href = "dashboard.html"
  }
}
function showPolicies() { window.location.href = "policies.html" }
function showOnboarding() { window.location.href = "onboarding.html" }
function showUserSettings() { window.location.href = "user-settings.html" }
function logout() { authManager.signOut() }
finction signInWithGoogle() { authManager.signInWithGoogle() }

// --- Password Visibility Toggle Function ---
function togglePasswordVisibility(inputId, buttonElement) {
    const input = document.getElementById(inputId);
    const icon = buttonElement.querySelector('i');
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}

// --- Custom Modal Functions ---
let _confirmModalResolve = null;
function showCustomModal(modalId, title, message, type, onConfirmCallback = null) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.querySelector(`#${modalId}-title`).textContent = title;
    modal.querySelector(`#${modalId}-message`).textContent = message;
    modal.classList.add('active');
    if (type === 'confirm' && onConfirmCallback) {
        _confirmModalResolve = onConfirmCallback;
    }
}
function closeCustomModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        _confirmModalResolve = null;
    }
}
function confirmModalCallback(result) {
    if (_confirmModalResolve) {
        _confirmModalResolve(result);
        closeCustomModal('confirm-modal');
    }
}
function showSuccessPopup(message, title = "Success!") {
    showCustomModal('success-modal', title, message, 'success');
}
function showErrorPopup(message, title = "Error!") {
    showCustomModal('error-modal', title, message, 'error');
}
function showConfirmPopup(message, onConfirm) {
    showCustomModal('confirm-modal', "Confirm Action", message, 'confirm', onConfirm);
}


// --- Global Form Event Listeners ---
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault()
  const email = document.getElementById("login-email").value
  const password = document.getElementById("login-password").value
  await authManager.signIn(email, password)
})
document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
  e.preventDefault()
  const username = document.getElementById("signup-username").value
  const email = document.getElementById("signup-email").value
  const password = document.getElementById("signup-password").value
  await authManager.signUp(email, password, username)
})
document.getElementById("admin-signup-form")?.addEventListener("submit", async (e) => {
  e.preventDefault()
  const username = document.getElementById("admin-username").value
  const email = document.getElementById("admin-email").value
  const password = document.getElementById("admin-password").value
  const adminSecret = document.getElementById("admin-secret").value
  await authManager.signUp(email, password, username, true, adminSecret)
})
document.getElementById("admin-login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("admin-login-email").value;
  const password = document.getElementById("admin-login-password").value;
  await authManager.signIn(email, password);
});


// --- Expose functions globally for HTML event handlers ---
window.showLanding = showLanding
window.showLogin = showLogin
window.showSignup = showSignup
window.showAdminLogin = showAdminLogin // New
window.showAdminSignup = showAdminSignup
window.showDashboard = showDashboard
window.showPolicies = showPolicies
window.showOnboarding = showOnboarding
window.showUserSettings = showUserSettings
window.logout = logout
window.signInWithGoogle = signInWithGoogle
window.togglePasswordVisibility = togglePasswordVisibility
window.closeCustomModal = closeCustomModal
window.confirmModalCallback = confirmModalCallback
window.showSuccessPopup = showSuccessPopup
window.showErrorPopup = showErrorPopup
window.showConfirmPopup = showConfirmPopup

// Functions for modals & actions (specific to admin-dashboard, but globally callable)
window.closeAddPolicyModal = () => { document.getElementById("add-policy-modal")?.classList.remove("active") }
window.showAddPolicyModal = () => { document.getElementById("add-policy-modal")?.classList.add("active") }
window.closeEditPolicyModal = () => { document.getElementById("edit-policy-modal")?.classList.remove("active") } // New edit policy modal
window.showEditPolicyModal = (policyId) => { // New edit policy modal
    adminManager.populateEditPolicyModal(policyId);
    document.getElementById("edit-policy-modal")?.classList.add("active");
}

window.deletePolicy = async (policyId) => {
  showConfirmPopup("Are you sure you want to delete this policy?", async (confirmed) => {
    if (confirmed) {
      await adminManager.deletePolicy(policyId)
    }
  });
}
window.deleteUser = async (userId) => {
  showConfirmPopup("Are you sure you want to permanently delete this user and all their data?", async (confirmed) => {
    if (confirmed) {
      await adminManager.deleteUser(userId)
    }
  });
}
window.triggerPolicyClaim = async (userId, policyId) => { // New trigger claim function
    showConfirmPopup("Are you sure you want to manually trigger this policy claim?", async (confirmed) => {
        if (confirmed) {
            await adminManager.triggerClaim(userId, policyId);
        }
    });
}

window.startPolicyExperience = (policyId) => {
  sessionStorage.setItem("pendingPolicyId", policyId);
  window.location.href = "onboarding.html";
}
window.completePolicyPurchase = async () => {
    const policyId = sessionStorage.getItem("pendingPolicyId");
    if (policyId) {
        sessionStorage.removeItem("pendingPolicyId");
        await policyManager.purchasePolicy(policyId);
    }
};


// --- Core Application Logic ---
class App {
  constructor() {
    this.init()
  }

  async init() {
    await authManager.init()
    await policyManager.init()
    this.setupCommonEventListeners()
    this.initializeCurrentPage()
  }

  setupCommonEventListeners() {
    window.addEventListener("online", () => { utils.showToast("Connection restored", "success") })
    window.addEventListener("offline", () => { utils.showToast("Connection lost. Some features may not work.", "warning") })
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal") || e.target.classList.contains("modal-custom")) {
        e.target.classList.remove("active")
      }
    })
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const activeModal = document.querySelector(".modal.active")
        if (activeModal) { activeModal.classList.remove("active") }
        const activeCustomModal = document.querySelector(".modal-custom.active")
        if (activeCustomModal) { activeCustomModal.classList.remove("active") }
      }
    })
  }

  initializeCurrentPage() {
    const path = window.location.pathname
    if (path.includes("dashboard.html")) { this.initializeDashboard() }
    else if (path.includes("admin-dashboard.html")) { this.initializeAdminDashboard() }
    else if (path.includes("policies.html")) { this.initializePolicies() }
    else if (path.includes("onboarding.html")) { this.initializeOnboarding() }
  }

  initializeDashboard() {
    if (!authManager.isAuthenticated()) { window.location.href = "login.html"; return; }
    const user = authManager.currentUser;
    const greeting = document.getElementById("user-greeting");
    const walletBalance = document.getElementById("wallet-balance");
    if (greeting && user.profile) { greeting.textContent = `Welcome, ${user.profile.name}!` }
    if (walletBalance && user.profile) { walletBalance.textContent = user.profile.wallet_balance.toFixed(2); }
    const stats = policyManager.getUserPolicyStats();
    document.getElementById("active-policies-count").textContent = stats.activePolicies;
    document.getElementById("total-claims-count").textContent = stats.totalClaims;
    document.getElementById("total-payouts").textContent = stats.totalPayouts.toFixed(2);
  }

  async initializeAdminDashboard() {
    if (!authManager.isAdmin()) { window.location.href = "dashboard.html"; return; }
    await adminManager.loadAdminData();
    adminManager.renderAdminDashboard();

    // Attach form listener for adding policies
    document.getElementById("add-policy-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const policyData = {
        name: document.getElementById("policy-name").value,
        type: document.getElementById("policy-type").value,
        cost: Number.parseFloat(document.getElementById("policy-cost").value),
        coverage_amount: Number.parseFloat(document.getElementById("policy-coverage-amount").value), // Added coverage_amount
        description: document.getElementById("policy-description").value,
        features: ["Instant claim processing", "Global coverage", "24/7 support"],
      };
      await adminManager.addPolicy(policyData);
      window.closeAddPolicyModal();
      document.getElementById("add-policy-form").reset();
    });

    // Attach form listener for editing policies
    document.getElementById("edit-policy-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const policyId = document.getElementById("edit-policy-id").value;
        const updatedData = {
            name: document.getElementById("edit-policy-name").value,
            type: document.getElementById("edit-policy-type").value,
            cost: Number.parseFloat(document.getElementById("edit-policy-cost").value),
            coverage_amount: Number.parseFloat(document.getElementById("edit-policy-coverage-amount").value), // Added coverage_amount
            description: document.getElementById("edit-policy-description").value,
            // Features are hardcoded for now, but could be dynamic
            features: ["Instant claim processing", "Global coverage", "24/7 support"]
        };
        await adminManager.updatePolicy(policyId, updatedData);
        window.closeEditPolicyModal();
    });
  }

  initializePolicies() {
    if (!authManager.isAuthenticated()) { window.location.href = "login.html"; return; }
    policyManager.renderPolicies();
  }

  initializeOnboarding() {
    onboardingManager.start();
    const videoElement = document.getElementById("ar-video");
    if (videoElement) {
        videoElement.onended = () => {
            console.log("Onboarding video ended. Completing purchase.");
            onboardingManager.complete(); // Trigger completion when video ends
        };
        videoElement.play().catch(error => console.error("Video autoplay failed:", error));
    }
  }
}

// Service Worker Registration (for PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => { console.log("SW registered: ", registration) })
      .catch((registrationError) => { console.log("SW registration failed: ", registrationError) })
  })
}

// Initialize the main app instance after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new App()
})