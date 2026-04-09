// ============================================================
//  FinanTra — auth.js
//  Handles login, register, guest login, and password reset.
//  Uses DataService for all backend calls.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const loginForm  = document.querySelector(".loginForm");
  const createForm = document.querySelector(".createForm");
  const resetForm  = document.querySelector(".resetForm");
  const guestBtn   = document.querySelector(".guest-btn");

  if (loginForm)  loginForm.addEventListener("submit",  handleLogin);
  if (createForm) createForm.addEventListener("submit", handleCreateAccount);
  if (resetForm)  resetForm.addEventListener("submit",  handleResetPassword);
  if (guestBtn)   guestBtn.addEventListener("click",    handleGuestLogin);
});

// ------------------------------------------------------------
//  LOGIN
// ------------------------------------------------------------

async function handleLogin(e) {
  e.preventDefault();

  const email    = document.getElementById("user").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showError("Please fill all fields");
    return;
  }

  const btn = e.target.querySelector("button[type=submit]");
  setLoading(btn, true);

  try {
    await DataService.login(email, password);
    window.location.href = "dashboard.html";
  } catch (err) {
    showError(err.message || "Login failed. Please check your credentials.");
  } finally {
    setLoading(btn, false);
  }
}

// ------------------------------------------------------------
//  REGISTER
// ------------------------------------------------------------

async function handleCreateAccount(e) {
  e.preventDefault();

  const name            = document.getElementById("name").value.trim();
  const email           = document.getElementById("email").value.trim();
  const phone           = document.getElementById("phone")?.value.trim() || "";
  const password        = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!name || !email || !password || !confirmPassword) {
    showError("Please fill all fields");
    return;
  }

  if (password !== confirmPassword) {
    showError("Passwords do not match");
    return;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters");
    return;
  }

  const btn = e.target.querySelector("button[type=submit]");
  setLoading(btn, true);

  try {
    await DataService.register({ name, email, password, phone });
    window.location.href = "dashboard.html";
  } catch (err) {
    showError(err.message || "Registration failed. Please try again.");
  } finally {
    setLoading(btn, false);
  }
}

// ------------------------------------------------------------
//  GUEST LOGIN
// ------------------------------------------------------------

function handleGuestLogin(e) {
  e.preventDefault();

  // Clear any stale token so DataService.isGuest() returns true
  localStorage.removeItem('finantra_token');
  localStorage.removeItem('isLoggedIn');
  localStorage.setItem('isGuest', 'true');

  window.location.href = "dashboard.html";
}

// ------------------------------------------------------------
//  PASSWORD RESET
// ------------------------------------------------------------

function handleResetPassword(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();

  if (!email) {
    showError("Please enter your email");
    return;
  }

  // No backend reset route yet — inform user
  showError("Password reset is not available yet. Please contact support.", "info");
}

// ------------------------------------------------------------
//  Helpers
// ------------------------------------------------------------

// Shows an error (or info) message on the page.
// Looks for an existing .auth-error element, creates one if absent.
function showError(message, type = "error") {
  // Remove any existing message
  document.querySelectorAll(".auth-error").forEach(el => el.remove());

  const div = document.createElement("div");
  div.className = "auth-error";
  div.textContent = message;
  div.style.cssText = `
    margin-top: 10px;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 0.9rem;
    text-align: center;
    background: ${type === "error" ? "#fde8e8" : "#e8f4fd"};
    color:      ${type === "error" ? "#c0392b"  : "#1f82a6"};
    border:     1px solid ${type === "error" ? "#f5c6cb" : "#b8daff"};
  `;

  // Append after the active form's submit button
  const activeForm = document.querySelector(".loginForm, .createForm, .resetForm");
  if (activeForm) activeForm.appendChild(div);

  // Auto-remove after 4 seconds
  setTimeout(() => div.remove(), 4000);
}

// Disables button and shows a loading label while awaiting API
function setLoading(btn, state) {
  if (!btn) return;
  btn.disabled = state;
  if (state) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = "Please wait...";
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
  }
}