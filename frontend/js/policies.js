// Path: frontend/js/policies.js
// Policy Management
import { supabase } from "./supabaseClient.js"
import { showLoading, hideLoading, showSuccessPopup, showErrorPopup } from "./utils.js"
import { authManager } from "./auth.js"
import { APP_CONFIG, DEFAULT_POLICIES } from "./config.js"

class PolicyManager {
  constructor() {
    this.policies = [...(DEFAULT_POLICIES || [])]
    this.userPolicies = []
  }

  async init() {
    await this.loadPolicies()
    await this.loadUserPolicies()
  }

  async loadPolicies() {
    try {
      const { data, error } = await supabase.from("policies").select("*").eq("status", "active")
      if (error) throw error
      if (data && data.length > 0) {
        this.policies = data
      }
    } catch (error) {
      console.error("Error loading policies:", error)
    }
  }

  async loadUserPolicies() {
    if (!authManager.isAuthenticated()) return
    try {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .eq("user_id", authManager.currentUser.id)
      if (error) throw error
      this.userPolicies = data || []
    } catch (error) {
      console.error("Error loading user policies:", error)
    }
  }

  async purchasePolicy(policyId) {
    if (!authManager.isAuthenticated()) {
      showErrorPopup("Please sign in to purchase policies", "Authentication Required");
      return;
    }
    try {
      showLoading();
      const policy = this.policies.find((p) => p.id === policyId);
      if (!policy) throw new Error("Policy not found");
      const currentBalance = authManager.currentUser.profile.wallet_balance;
      if (currentBalance < policy.cost) {
        throw new Error("Insufficient wallet balance");
      }
      const { error: walletError } = await supabase
        .from("users")
        .update({ wallet_balance: currentBalance - policy.cost })
        .eq("id", authManager.currentUser.id);
      if (walletError) throw walletError;
      const { error: policyError } = await supabase.from("policies").insert([
        {
          user_id: authManager.currentUser.id,
          type: policy.type,
          name: policy.name, // Ensure name is passed
          cost: policy.cost,
          coverage_amount: policy.coverage_amount || 0.00, // Ensure coverage_amount is passed
          status: "active",
        },
      ]);
      if (policyError) throw policyError;
      const { error: transactionError } = await supabase.from("transactions").insert([
        {
          user_id: authManager.currentUser.id,
          amount: -policy.cost,
          type: "purchase",
          description: `Policy purchase: ${policy.name}`, // Add description
          created_at: new Date().toISOString(),
        },
      ]);
      if (transactionError) throw transactionError;
      authManager.currentUser.profile.wallet_balance -= policy.cost;
      showSuccessPopup(`${policy.name} purchased successfully!`, "Policy Purchased");
      await this.loadUserPolicies();
      window.location.href = "dashboard.html";
    } catch (error) {
      showErrorPopup(error.message, "Purchase Failed");
    } finally {
      hideLoading();
    }
  }

  renderPolicies() {
    const grid = document.getElementById("policies-grid")
    if (!grid) return
    grid.innerHTML = this.policies
      .map((policy) => {
        const typeInfo = APP_CONFIG.POLICY_TYPES[policy.type] || { icon: "📋", name: policy.type }
        return `
                <div class="policy-card">
                    <div class="policy-header">
                        <div class="policy-icon">${typeInfo.icon}</div>
                        <h3 class="policy-title">${policy.name}</h3>
                        <div class="policy-price">$${policy.cost}</div>
                    </div>
                    <div class="policy-body">
                        <p class="mb-3">${policy.description}</p>
                        <ul class="policy-features">
                            ${policy.features.map((feature) => `<li>${feature}</li>`).join("")}
                        </ul>
                        <button class="btn-primary btn-full" onclick="startPolicyExperience('${policy.id}')">
                            Start Experience
                        </button>
                    </div>
                </div>
            `
      })
      .join("")
  }

  async addPolicy(policyData) {
    try {
      const { error } = await supabase.from("policies").insert([
        {
          ...policyData,
          status: "active",
        },
      ])
      if (error) throw error
      await this.loadPolicies()
      showSuccessPopup("Policy added successfully!", "Policy Added");
    } catch (error) {
      showErrorPopup(error.message, "Failed to Add Policy");
    }
  }

  async deletePolicy(policyId) {
    try {
      const { error } = await supabase.from("policies").update({ status: "inactive" }).eq("id", policyId)
      if (error) throw error
      await this.loadPolicies()
      showSuccessPopup("Policy deleted successfully!", "Policy Deleted");
    } catch (error) {
      showErrorPopup(error.message, "Failed to Delete Policy");
    }
  }

  async updatePolicy(policyId, updatedData) {
    try {
        showLoading();
        const { error } = await supabase.from("policies").update(updatedData).eq("id", policyId);
        if (error) throw error;
        await this.loadPolicies(); // Reload all policies
        showSuccessPopup("Policy updated successfully!", "Policy Updated");
    } catch (error) {
        showErrorPopup(error.message, "Failed to Update Policy");
    } finally {
        hideLoading();
    }
  }

  getUserPolicyStats() {
    const activePolicies = this.userPolicies.filter((p) => p.status === "active").length
    const totalClaims = this.userPolicies.filter((p) => p.status === "claimed").length
    const totalPayouts = this.userPolicies.filter((p) => p.status === "claimed").reduce((sum, p) => sum + p.cost, 0)
    return { activePolicies, totalClaims, totalPayouts }
  }
}

export const policyManager = new PolicyManager()