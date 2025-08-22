// Path: frontend/js/supabaseClient.js
// Supabase Client Configuration
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2"
import { PROJECT_URL, ANON_KEY  } from "./config.js"

export const supabase = createClient(PROJECT_URL, ANON_KEY , {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
window.supabase = supabase