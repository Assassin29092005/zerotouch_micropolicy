// Path: frontend/js/utils.js
// Utility Functions
function showLoading() {
  document.getElementById("loading")?.classList.remove("hidden");
}
function hideLoading() {
  document.getElementById("loading")?.classList.add("hidden");
}
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 5000);
}
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}
function generateHash() {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}
function getLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return defaultValue;
  }
}
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
function validatePassword(password) {
  return password.length >= 6;
}
function fadeIn(element, duration = 300) {
  if (!element) return;
  element.style.opacity = "0";
  element.style.display = "block";
  let start = null;
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    element.style.opacity = Math.min(progress / duration, 1);
    if (progress < duration) {
      requestAnimationFrame(animate);
    }
  }
  requestAnimationFrame(animate);
}
function fadeOut(element, duration = 300) {
  if (!element) return;
  let start = null;
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    element.style.opacity = Math.max(1 - progress / duration, 0);
    if (progress < duration) {
      requestAnimationFrame(animate);
    } else {
      element.style.display = "none";
    }
  }
  requestAnimationFrame(animate);
}
function handleError(error, context = "") {
  console.error(`Error in ${context}:`, error);
  showToast(`An error occurred: ${error.message}`, "error");
}
function checkNetworkStatus() {
  return navigator.onLine;
}
function isMobile() {
  return window.innerWidth <= 768;
}
function isTablet() {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
}
function isDesktop() {
  return window.innerWidth > 1024;
}

let _confirmModalResolve = null;

function showCustomModal(modalId, title, message, type, onConfirmCallback = null) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal with ID '${modalId}' not found.`);
        return;
    }
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


export {
  showToast,
  showLoading,
  hideLoading,
  formatCurrency,
  formatDate,
  generateHash,
  debounce,
  setLocalStorage,
  getLocalStorage,
  validateEmail,
  validatePassword,
  fadeIn,
  fadeOut,
  handleError,
  checkNetworkStatus,
  isMobile,
  isTablet,
  isDesktop,
  showSuccessPopup,
  showErrorPopup,
  showConfirmPopup,
  closeCustomModal,
  confirmModalCallback
}

export const showNotification = showToast;