// Path: frontend/js/user-settings.js
// User Settings Management
import { supabase } from "./supabaseClient.js"
import { showSuccessPopup, showErrorPopup, showConfirmPopup } from "./utils.js"
import { authManager } from "./auth.js"

class UserSettingsManager {
  constructor() {
    this.init()
  }

  async init() {
    await this.loadUserProfile()
    this.setupEventListeners()
  }

  async loadUserProfile() {
    try {
      const user = authManager.currentUser
      if (user) {
        document.getElementById("username").value = user.profile?.username || "Not set" // Use username
        document.getElementById("email").value = user.email
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      showErrorPopup("Error loading profile", "Profile Load Failed");
    }
  }

  setupEventListeners() {
    document.getElementById("changePasswordForm")?.addEventListener("submit", (e) => {
      e.preventDefault()
      this.changePassword()
    })
    document.getElementById("deleteAccountBtn")?.addEventListener("click", () => {
      this.showDeleteModal()
    })
  }

  async changePassword() {
    const newPassword = document.getElementById("newPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value
    if (newPassword !== confirmPassword) {
      showErrorPopup("Passwords do not match", "Password Change Failed");
      return;
    }
    if (newPassword.length < 6) {
      showErrorPopup("Password must be at least 6 characters", "Password Change Failed");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        throw new Error(error.message);
      }
      showSuccessPopup("Password updated successfully!", "Password Changed");
      document.getElementById("changePasswordForm").reset();
    } catch (error) {
      console.error("Error changing password:", error);
      showErrorPopup("Error updating password: " + error.message, "Password Change Failed");
    }
  }

  showDeleteModal() {
    document.getElementById("deleteModal").style.display = "flex";
  }

  async confirmDeleteAccount() {
    const confirmationInput = document.getElementById("deleteConfirmation");
    const confirmationText = confirmationInput.value;

    if (confirmationText !== "DELETE") {
      showErrorPopup("Please type DELETE to confirm", "Confirmation Required");
      return;
    }

    showConfirmPopup("Are you absolutely sure you want to delete your account? This action cannot be undone.", async (confirmed) => {
        if (confirmed) {
            try {
                const user = authManager.currentUser;
                const response = await fetch('/api/admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authManager.currentUser.accessToken}`
                    },
                    body: JSON.stringify({ action: 'delete_user', payload: { userId: user.id } })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete account.');
                }
                showSuccessPopup("Account deleted successfully", "Account Deleted");
                closeDeleteModal();
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 2000);
            } catch (error) {
                console.error("Error deleting account:", error);
                showErrorPopup("Error deleting account: " + error.message, "Deletion Failed");
            }
        } else {
            closeDeleteModal();
        }
    });
  }
}

function closeDeleteModal() {
  document.getElementById("deleteModal")?.style.display = "none";
  document.getElementById("deleteConfirmation").value = "";
}
function confirmDeleteAccount() {
  window.userSettingsManager.confirmDeleteAccount();
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("user-settings.html")) {
    window.userSettingsManager = new UserSettingsManager();
  }
});
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteAccount = confirmDeleteAccount;
export { UserSettingsManager }