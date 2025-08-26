// Path: js/auth.js
// Authentication Management
import { supabase } from "./supabaseClient.js"
import { showLoading, hideLoading, showSuccessPopup, showErrorPopup } from "./utils.js"
import { APP_CONFIG } from "./config.js"

// Define the full URL for the Edge Function
const ADMIN_API_URL = "https://xoivmwfqgcbpeqcwxdal.supabase.co/functions/v1/admin"

class AuthManager {
  constructor() {
    this.currentUser = null
    this._isAuthenticated = false
  }

  async init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      this.currentUser = session.user
      this._isAuthenticated = true
      await this.loadUserProfile()
    }
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        this.currentUser = session.user
        this._isAuthenticated = true
        await this.loadUserProfile()
        window.location.href = this.currentUser?.profile?.is_admin ? "admin-dashboard.html" : "dashboard.html"
      } else if (event === "SIGNED_OUT") {
        this.currentUser = null
        this._isAuthenticated = false
        window.location.href = "index.html"
      }
    })
  }

  async loadUserProfile() {
    if (!this.currentUser) return
    const { data, error } = await supabase.from("users").select("*").eq("id", this.currentUser.id).single()
    if (data) {
      this.currentUser.profile = data
    } else {
      console.error("Error loading user profile:", error)
    }
  }

  async signUp(email, password, username, isAdmin = false, adminSecret = null) {
    try {
      showLoading()

      if (isAdmin) {
        // CORRECTED: The fetch call now uses the full, direct URL
        const response = await fetch(ADMIN_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_admin_user',
            payload: { email, password, username, adminSecret }
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to create admin account. Check secret key or permissions.");
        }
        showSuccessPopup("Admin account created successfully! Please check your email to verify.", "Account Created");
      } else {
        const { error } = await supabase.rpc('sign_up_and_create_profile', {
            email,
            password,
            username
        });
        if (error) throw error;

        showSuccessPopup("Account created successfully! Please check your email to verify.", "Account Created");
      }
      window.location.href = "login.html";
    } catch (error) {
      showErrorPopup(error.message, "Sign Up Failed");
    } finally {
      hideLoading();
    }
  }

  async signIn(email, password) {
    try {
      showLoading();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showSuccessPopup("Welcome back!", "Signed In");
    } catch (error) {
      showErrorPopup(error.message, "Login Failed");
    } finally {
      hideLoading();
    }
  }

  async signInWithGoogle() {
    try {
      showLoading();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
      // The browser will redirect the user to Google for sign-in.
      // The onAuthStateChange listener will handle the redirect back to the dashboard.
    } catch (error) {
      showErrorPopup(error.message, "Google Sign-in Failed");
    } finally {
      hideLoading();
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showSuccessPopup("Signed out successfully", "Signed Out");
    } catch (error) {
      showErrorPopup(error.message, "Sign Out Failed");
    }
  }

  isAuthenticated() {
    return this._isAuthenticated;
  }

  isAdmin() {
    return this.currentUser?.profile?.is_admin || false;
  }
}

export const authManager = new AuthManager();