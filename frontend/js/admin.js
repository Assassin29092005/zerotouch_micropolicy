// Path: frontend/js/admin.js
// Admin Management
import { authManager } from "./auth.js"
import { supabase } from "./supabaseClient.js"
import { showSuccessPopup, showErrorPopup, showConfirmPopup } from "./utils.js"

class AdminManager {
  constructor() {
    this.policies = []
    this.users = []
    this.claims = []
  }

  async loadAdminData() {
    if (!authManager.isAdmin()) return
    try {
      const { data: policies, error: policiesError } = await supabase.from("policies").select("*")
      if (policiesError) throw policiesError
      this.policies = policies || []

      const { data: users, error: usersError } = await supabase.from("users").select("*")
      if (usersError) throw usersError
      this.users = users || []

      const { data: claims, error: claimsError } = await supabase.from("claims").select("*")
      if (claimsError) throw claimsError
      this.claims = claims || []
    } catch (error) {
      console.error("Error loading admin data:", error)
    }
  }

  renderAdminDashboard() {
    this.renderAdminStats()
    this.renderPoliciesList()
    this.renderUsersList()
    this.renderPopularityChart()
  }

  renderAdminStats() {
    const totalUsers = document.getElementById("total-users")
    const totalPolicies = document.getElementById("total-policies")
    const activeClaims = document.getElementById("active-claims")
    if (totalUsers) totalUsers.textContent = this.users.length
    if (totalPolicies) totalPolicies.textContent = this.policies.filter((p) => p.status === "active").length
    if (activeClaims) activeClaims.textContent = this.claims.filter((c) => c.status === "pending").length
  }

  renderPoliciesList() {
    const list = document.getElementById("admin-policies-list")
    if (!list) return
    const activePolicies = this.policies.filter((p) => p.status === "active")
    list.innerHTML = activePolicies
      .map(
        (policy) => `
            <div class="admin-policy-item">
                <div class="admin-policy-info">
                    <h4>${policy.name || policy.type}</h4>
                    <p>$${policy.cost} • ${policy.type}</p>
                </div>
                <button class="btn-danger btn-small" onclick="deletePolicy('${policy.id}')">
                    Delete
                </button>
            </div>
        `,
      )
      .join("")
  }

  renderUsersList() {
    const list = document.getElementById("admin-users-list")
    if (!list) return
    list.innerHTML = this.users
      .map(
        (user) => `
            <div class="admin-user-item">
                <div class="admin-user-info">
                    <h4>${user.name || user.email}</h4>
                    <p>${user.email} • Balance: $${user.wallet_balance || 0}</p>
                    <small>Joined: ${new Date(user.created_at).toLocaleDateString()}</small>
                </div>
                <button class="btn-danger btn-small" onclick="deleteUser('${user.id}')">
                    Delete User
                </button>
            </div>
        `,
      )
      .join("")
  }

  renderPopularityChart() {
    const canvas = document.getElementById("popularity-chart")
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const typeCounts = {}
    this.policies.forEach((policy) => {
      typeCounts[policy.type] = (typeCounts[policy.type] || 0) + 1
    })
    const types = Object.keys(typeCounts)
    const counts = Object.values(typeCounts)
    const maxCount = Math.max(...counts)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const barWidth = canvas.width / types.length
    const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]
    types.forEach((type, index) => {
      const barHeight = (counts[index] / maxCount) * (canvas.height - 40)
      const x = index * barWidth
      const y = canvas.height - barHeight - 20
      ctx.fillStyle = colors[index % colors.length]
      ctx.fillRect(x + 10, y, barWidth - 20, barHeight)
      ctx.fillStyle = "#64748b"
      ctx.font = "12px Inter"
      ctx.textAlign = "center"
      ctx.fillText(type, x + barWidth / 2, canvas.height - 5)
      ctx.fillText(counts[index], x + barWidth / 2, y - 5)
    })
  }

  async addPolicy(policyData) {
    try {
      const { error } = await supabase.from("policies").insert([
        {
          ...policyData,
          status: "active",
          created_at: new Date().toISOString(),
        },
      ])
      if (error) throw error
      await this.loadAdminData()
      this.renderAdminDashboard()
      showSuccessPopup("Policy added successfully!", "Policy Added");
    } catch (error) {
      showErrorPopup(error.message, "Failed to Add Policy");
    }
  }

  async deletePolicy(policyId) {
    try {
      const { error } = await supabase.from("policies").update({ status: "inactive" }).eq("id", policyId)
      if (error) throw error
      await this.loadAdminData()
      this.renderAdminDashboard()
      showSuccessPopup("Policy deleted successfully!", "Policy Deleted");
    } catch (error) {
      showErrorPopup(error.message, "Failed to Delete Policy");
    }
  }

  async deleteUser(userId) {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authManager.currentUser.accessToken}`
        },
        body: JSON.stringify({ action: 'delete_user', payload: { userId: userId } })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user.')
      }
      await this.loadAdminData()
      this.renderAdminDashboard()
      showSuccessPopup("User deleted successfully!", "User Deleted");
    } catch (error) {
      showErrorPopup("Error deleting user: " + error.message, "Deletion Failed");
    }
  }

  async updatePolicy(policyId, updatedData) {
    try {
        showLoading();
        const { error } = await supabase.from("policies").update(updatedData).eq("id", policyId);
        if (error) throw error;
        await this.loadAdminData();
        this.renderAdminDashboard();
        showSuccessPopup("Policy updated successfully!", "Policy Updated");
    } catch (error) {
        showErrorPopup(error.message, "Failed to Update Policy");
    } finally {
        hideLoading();
    }
  }

  async populateEditPolicyModal(policyId) {
    const policy = this.policies.find(p => p.id === policyId);
    if (!policy) {
      showErrorPopup("Policy not found for editing.");
      return;
    }
    document.getElementById("edit-policy-id").value = policy.id;
    document.getElementById("edit-policy-name").value = policy.name;
    document.getElementById("edit-policy-type").value = policy.type;
    document.getElementById("edit-policy-cost").value = policy.cost;
    document.getElementById("edit-policy-coverage-amount").value = policy.coverage_amount;
    document.getElementById("edit-policy-description").value = policy.description;
  }
}

export const adminManager = new AdminManager()