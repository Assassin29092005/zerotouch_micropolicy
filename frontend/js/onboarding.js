// Path: frontend/js/onboarding.js
// AR Onboarding Experience
import { showSuccessPopup } from "./utils.js";
import { policyManager } from "./policies.js";

class OnboardingManager {
  constructor() {
    this.currentStep = 0
    this.totalSteps = 5 // Still showing 5 steps in progress bar, even with video
    this.steps = [
      {
        icon: "💡",
        title: "Smart Detection",
        description:
          "Our AI continuously monitors global data sources to detect events that could trigger your policy claims automatically.",
      },
      {
        icon: "⏱️",
        title: "Instant Processing",
        description:
          "When a qualifying event is detected, our system processes your claim in under 30 seconds with 99.9% accuracy.",
      },
      {
        icon: "🔗",
        title: "Blockchain Verification",
        description:
          "Every claim is recorded on our blockchain for complete transparency and immutable proof of processing.",
      },
      {
        icon: "💸",
        title: "Automatic Payout",
        description:
          "Approved claims are instantly paid out to your preferred payment method with zero fees and no waiting periods.",
      },
      {
        icon: "🌍",
        title: "Global Coverage",
        description: "Your policies work anywhere in the world with 24/7 monitoring and support in over 50 languages.",
      },
    ]
  }

  start() {
    this.currentStep = 0
    this.updateProgress()
    this.renderStep() // This will render the video placeholder
    this.updateControls()

    // Attach video listener if on onboarding page
    const videoElement = document.getElementById("ar-video");
    if (videoElement) {
        // Ensure the video plays and then completes the purchase
        videoElement.onended = () => {
            console.log("Onboarding video ended. Completing purchase.");
            this.complete(); // Trigger completion when video ends
        };
        // Attempt to play, catch errors for autoplay policies
        videoElement.play().catch(error => console.error("Video autoplay failed:", error));
    }
  }

  nextStep() {
    // For the video-based onboarding, 'Next' button might be less relevant,
    // but we'll keep it to allow manual progression if video fails/is skipped.
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++
      this.updateProgress()
      this.renderStep()
      this.updateControls()
    } else {
      this.complete()
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--
      this.updateProgress()
      this.renderStep()
      this.updateControls()
    }
  }

  updateProgress() {
    const progressFill = document.getElementById("progress-fill")
    const progressText = document.getElementById("progress-text")
    if (progressFill && progressText) {
      const percentage = ((this.currentStep + 1) / this.totalSteps) * 100
      progressFill.style.width = `${percentage}%`
      progressText.textContent = `Step ${this.currentStep + 1} of ${this.totalSteps}`
    }
  }

  renderStep() {
    // For the AR video, we only show the video content on the first "step"
    // The HTML already contains the video element.
    // If you want to show the step icons/descriptions AFTER the video,
    // you'd need more complex logic here.
    const content = document.getElementById("onboarding-content")
    if (!content) return

    // If you want to cycle through steps AFTER the video, you'd re-enable this.
    // For now, the video is the primary content of the onboarding page.
    // const step = this.steps[this.currentStep]
    // content.innerHTML = `...`
  }

  updateControls() {
    const prevBtn = document.getElementById("prev-btn")
    const nextBtn = document.getElementById("next-btn")
    if (prevBtn) {
      prevBtn.disabled = this.currentStep === 0
    }
    if (nextBtn) {
      nextBtn.textContent = this.currentStep === this.totalSteps - 1 ? "Complete" : "Next"
    }
  }

  async complete() {
    const pendingPolicyId = sessionStorage.getItem("pendingPolicyId");
    if (pendingPolicyId) {
        sessionStorage.removeItem("pendingPolicyId");
        await policyManager.purchasePolicy(pendingPolicyId);
    } else {
        window.location.href = "dashboard.html";
    }
  }
}

export const onboardingManager = new OnboardingManager()