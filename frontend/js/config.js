// Path: frontend/js/config.js
// Supabase Configuration - ONLY PUBLIC KEYS HERE!
export const PROJECT_URL  = "https://xoivmwfqgcbpeqcwxdal.supabase.co"; // REPLACE THIS
export const ANON_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaXZtd2ZxZ2NicGVxY3d4ZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTkxMDgsImV4cCI6MjA3MTM3NTEwOH0.bDWTFbwMEiInhnR-4O5M8NxpHKtPdLJMu5rAyzLEj0c"; // REPLACE THIS

// App Configuration (non-sensitive)
export const APP_CONFIG = {
  // ADMIN_SECRET_KEY is only used by the backend Edge Function now,
  // but kept here for reference if client-side validation is needed for non-critical features.
  // For admin signup, the secret is sent to the backend for validation.
  ADMIN_SECRET_KEY: "ZEROTOUCH_ADMIN_2024_SECURE",
  DEFAULT_WALLET_BALANCE: 1000.0,
  POLICY_TYPES: {
    device: { icon: "📱", name: "Device Protection" },
    travel: { icon: "✈️", name: "Travel Insurance" },
    event: { icon: "🎫", name: "Event Coverage" },
    health: { icon: "🏥", name: "Health Coverage" },
    auto: { icon: "🚗", name: "Auto Protection" },
    home: { icon: "🏠", name: "Home Security" },
  },
};

export const DEFAULT_POLICIES = [
  {
    id: "device-protection-default", // Changed ID to avoid conflict if added to DB
    name: "Device Protection",
    type: "device",
    cost: 9.99,
    coverage_amount: 500.00, // Added coverage amount
    description: "Comprehensive protection for your mobile devices against damage, theft, and malfunction.",
    features: ["Instant claim processing", "Global coverage", "No deductibles", "24/7 support"],
  },
  {
    id: "travel-insurance-default", // Changed ID
    name: "Travel Insurance",
    type: "travel",
    cost: 15.99,
    coverage_amount: 1000.00, // Added coverage amount
    description: "Complete travel protection including trip cancellation, medical emergencies, and lost luggage.",
    features: [
      "Trip cancellation coverage",
      "Medical emergency assistance",
      "Lost luggage protection",
      "Flight delay compensation",
    ],
  },
  {
    id: "event-coverage-default", // Changed ID
    name: "Event Coverage",
    type: "event",
    cost: 12.99,
    coverage_amount: 200.00, // Added coverage amount
    description: "Protection for special events against cancellation, weather, and vendor issues.",
    features: ["Weather protection", "Vendor failure coverage", "Venue issues protection", "Guest injury coverage"],
  },
  {
    id: "health-coverage-default", // Changed ID
    name: "Health Coverage",
    type: "health",
    cost: 24.99,
    coverage_amount: 5000.00, // Added coverage amount
    description: "Supplemental health coverage for unexpected medical expenses and emergencies.",
    features: ["Emergency medical coverage", "Prescription assistance", "Telemedicine access", "Mental health support"],
  },
  {
    id: "auto-protection-default", // Changed ID
    name: "Auto Protection",
    type: "auto",
    cost: 19.99,
    coverage_amount: 2500.00, // Added coverage amount
    description: "Comprehensive auto protection covering accidents, theft, and mechanical breakdowns.",
    features: ["Accident coverage", "Theft protection", "Roadside assistance", "Rental car coverage"],
  },
  {
    id: "home-security-default", // Changed ID
    name: "Home Security",
    type: "home",
    cost: 29.99,
    coverage_amount: 10000.00, // Added coverage amount
    description: "Advanced home security coverage including break-ins, damage, and smart home protection.",
    features: ["Break-in protection", "Property damage coverage", "Smart device protection", "Emergency response"],
  },
];