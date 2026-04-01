// ================================
// PROFILE PAGE — profile.js
// Handles: identity, personal info,
// financial summary, preferences,
// dark mode, data management
// ================================


// ================================
// LOCALSTORAGE KEYS
// ================================

const KEY_USER_ID     = "finantra_user_id";
const KEY_PROFILE     = "finantra_user_profile";
const KEY_PREFS       = "finantra_preferences";
const KEY_TRANSACTIONS = "finantra_transactions";


// ================================
// AVATAR COLOR MAP (by first letter)
// ================================

const avatarColors = {
    A: "#e74c3c", B: "#e67e22", C: "#f1c40f", D: "#2ecc71",
    E: "#1abc9c", F: "#3498db", G: "#9b59b6", H: "#e91e63",
    I: "#00bcd4", J: "#ff5722", K: "#8bc34a", L: "#673ab7",
    M: "#1f82a6", N: "#ff9800", O: "#4caf50", P: "#f44336",
    Q: "#9c27b0", R: "#2196f3", S: "#009688", T: "#ff5252",
    U: "#7c4dff", V: "#00e676", W: "#ffd740", X: "#40c4ff",
    Y: "#69f0ae", Z: "#ea80fc"
};

function getAvatarColor(name) {
    if (!name || name.trim() === "") return "#1f82a6";
    const letter = name.trim()[0].toUpperCase();
    return avatarColors[letter] || "#1f82a6";
}

function getInitials(name) {
    if (!name || name.trim() === "") return "?";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}


// ================================
// GENERATE USER ID
// ================================

function generateUserId() {
    const year   = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return "FT-" + year + "-" + random;
}

function getOrCreateUserId() {
    let id = localStorage.getItem(KEY_USER_ID);
    if (!id) {
        id = generateUserId();
        localStorage.setItem(KEY_USER_ID, id);
    }
    return id;
}


// ================================
// COPY USER ID TO CLIPBOARD
// ================================

function copyUserId() {
    const id  = document.getElementById("profileUserId").textContent;
    const btn = document.getElementById("copyIdBtn");

    navigator.clipboard.writeText(id).then(function () {
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        btn.style.color = "#28a745";
        setTimeout(function () {
            btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
            btn.style.color = "";
        }, 2000);
    }).catch(function () {
        // Fallback for older browsers
        prompt("Copy your ID:", id);
    });
}


// ================================
// FORMAT DATE
// ================================

function formatMemberSince(dateStr) {
    if (!dateStr) return "—";
    const d      = new Date(dateStr);
    const months = ["Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[d.getMonth()] + " " + d.getFullYear();
}


// ================================
// LOAD PROFILE DATA
// ================================

function loadProfile() {
    const profile = JSON.parse(localStorage.getItem(KEY_PROFILE)) || {};
    const userId  = getOrCreateUserId();

    // Set profile header
    const name = profile.name || "";
    updateAvatarDisplay(name);
    document.getElementById("profileDisplayName").textContent = name || "Your Name";
    document.getElementById("profileUserId").textContent      = userId;
    document.getElementById("memberSince").textContent        =
        "Member since " + formatMemberSince(profile.memberSince || new Date().toISOString());

    // Fill form fields
    document.getElementById("inputName").value  = profile.name  || "";
    document.getElementById("inputEmail").value = profile.email || "";
    document.getElementById("inputPhone").value = profile.phone || "";
}


// ================================
// UPDATE AVATAR DISPLAY
// ================================

function updateAvatarDisplay(name) {
    const circle   = document.getElementById("avatarCircle");
    const initials = document.getElementById("avatarInitials");

    initials.textContent     = getInitials(name);
    circle.style.background  = getAvatarColor(name) + "55"; // semi-transparent
    circle.style.borderColor = getAvatarColor(name) + "88";
}

// Live update as user types name
function updateAvatarLive() {
    const name = document.getElementById("inputName").value;
    updateAvatarDisplay(name);
    document.getElementById("profileDisplayName").textContent = name || "Your Name";
}


// ================================
// SAVE PERSONAL INFO
// ================================

function savePersonalInfo() {
    const existing = JSON.parse(localStorage.getItem(KEY_PROFILE)) || {};

    const profile = {
        name:        document.getElementById("inputName").value.trim(),
        email:       document.getElementById("inputEmail").value.trim(),
        phone:       document.getElementById("inputPhone").value.trim(),
        memberSince: existing.memberSince || new Date().toISOString()
    };

    localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));

    // Update display name
    document.getElementById("profileDisplayName").textContent =
        profile.name || "Your Name";

    // Show success message
    showSaveMsg("personalSaveMsg");
}


// ================================
// LOAD FINANCIAL SUMMARY
// ================================

function loadFinancialSummary() {
    const transactions = JSON.parse(localStorage.getItem(KEY_TRANSACTIONS)) || [];

    let income  = 0;
    let expense = 0;

    transactions.forEach(function (t) {
        if (t.type === "Income") income  += parseFloat(t.amount);
        else                     expense += parseFloat(t.amount);
    });

    const savings = income - expense;

    document.getElementById("finIncome").textContent  = "₹ " + income.toLocaleString("en-IN");
    document.getElementById("finExpense").textContent = "₹ " + expense.toLocaleString("en-IN");

    const savingsEl = document.getElementById("finSavings");
    savingsEl.textContent = (savings >= 0 ? "₹ " : "-₹ ") +
        Math.abs(savings).toLocaleString("en-IN");
    savingsEl.style.color = savings >= 0 ? "#28a745" : "#dc3545";

    document.getElementById("finCount").textContent = transactions.length;
}


// ================================
// LOAD PREFERENCES
// ================================

function loadPreferences() {
    const prefs = JSON.parse(localStorage.getItem(KEY_PREFS)) || {};

    // Default filter
    const filterEl = document.getElementById("prefFilter");
    filterEl.value = prefs.defaultFilter || "monthly";

    // Starting balance
    document.getElementById("prefBalance").value = prefs.startingBalance || "";

    // Theme
    const theme = prefs.theme || "light";
    applyTheme(theme, false); // false = don't save again on load
}


// ================================
// SAVE PREFERENCES
// ================================

function savePreferences() {
    const existing = JSON.parse(localStorage.getItem(KEY_PREFS)) || {};

    const prefs = {
        defaultFilter:   document.getElementById("prefFilter").value,
        startingBalance: parseFloat(document.getElementById("prefBalance").value) || 0,
        theme:           existing.theme || "light"
    };

    localStorage.setItem(KEY_PREFS, JSON.stringify(prefs));
    showSaveMsg("prefSaveMsg");
}


// ================================
// THEME TOGGLE
// ================================

function setTheme(theme) {
    applyTheme(theme, true); // true = save to localStorage
}

function applyTheme(theme, save) {
    const lightBtn = document.getElementById("lightBtn");
    const darkBtn  = document.getElementById("darkBtn");

    if (theme === "dark") {
        document.body.classList.add("dark-mode");
        lightBtn.classList.remove("active");
        darkBtn.classList.add("active");
    } else {
        document.body.classList.remove("dark-mode");
        lightBtn.classList.add("active");
        darkBtn.classList.remove("active");
    }

    if (save) {
        const prefs   = JSON.parse(localStorage.getItem(KEY_PREFS)) || {};
        prefs.theme   = theme;
        localStorage.setItem(KEY_PREFS, JSON.stringify(prefs));
    }
}

// Apply saved theme on any page load
// (Called from dashboard.js area — but we add it here for profile page)
(function applySavedTheme() {
    const prefs = JSON.parse(localStorage.getItem(KEY_PREFS)) || {};
    if (prefs.theme === "dark") {
        document.body.classList.add("dark-mode");
    }
})();


// ================================
// SHOW SAVE SUCCESS MESSAGE
// ================================

function showSaveMsg(elementId) {
    const el = document.getElementById(elementId);
    el.classList.add("visible");
    setTimeout(function () {
        el.classList.remove("visible");
    }, 3000);
}


// ================================
// DATA MANAGEMENT — CLEAR TRANSACTIONS
// ================================

// function clearTransactions() {
//     const confirmed1 = confirm(
//         "Are you sure you want to delete ALL transactions?\n\nThis action cannot be undone."
//     );
//     if (!confirmed1) return;

//     const confirmed2 = confirm(
//         "This will permanently delete all your saved transactions.\n\nClick OK to confirm."
//     );
//     if (!confirmed2) return;

//     localStorage.removeItem(KEY_TRANSACTIONS);

//     // Refresh financial summary
//     loadFinancialSummary();

//     alert("All transactions have been cleared.");
// }
function clearTransactions() {
    openModal({
        icon:         "🗑️",
        title:        "Clear All Transactions?",
        message:      "This will permanently delete all your saved transactions.<br><br>This action <strong>cannot be undone</strong>.",
        confirmText:  "Clear Transactions",
        confirmClass: "",
        onConfirm: function () {
            localStorage.removeItem(KEY_TRANSACTIONS);
            loadFinancialSummary();
            showSaveMsg("personalSaveMsg");
        }
    });
}


// ================================
// DATA MANAGEMENT — RESET APP
// ================================

// function resetApp() {
//     const confirmed1 = confirm(
//         "⚠️ RESET APP\n\nThis will delete EVERYTHING:\n• All transactions\n• Your profile\n• All preferences\n• All custom categories\n\nAre you absolutely sure?"
//     );
//     if (!confirmed1) return;

//     const confirmed2 = confirm(
//         "Final confirmation — this cannot be undone.\n\nClick OK to completely reset FinanTra."
//     );
//     if (!confirmed2) return;

//     // Clear all FinanTra localStorage keys
//     const keysToRemove = [
//         KEY_TRANSACTIONS,
//         KEY_PROFILE,
//         KEY_PREFS,
//         KEY_USER_ID,
//         "finantra_custom_income",
//         "finantra_custom_expense"
//     ];

//     keysToRemove.forEach(function (key) {
//         localStorage.removeItem(key);
//     });

//     alert("App has been reset. Redirecting to login...");
//     window.location.href = "login.html";
// }
function resetApp() {
    openModal({
        icon:         "⚠️",
        title:        "Reset App?",
        message:      `This will permanently delete everything:<ul>
            <li>All transactions</li>
            <li>Your profile data</li>
            <li>All preferences</li>
            <li>Custom categories</li>
        </ul>`,
        confirmText:  "Reset Everything",
        confirmClass: "danger-dark",
        onConfirm: function () {
            openModal({
                icon:         "⚠️",
                title:        "Final Confirmation",
                message:      "This is <strong>irreversible</strong>. Click confirm to completely reset FinanTra.",
                confirmText:  "Yes, Reset",
                confirmClass: "danger-dark",
                onConfirm: function () {
                    [KEY_TRANSACTIONS, KEY_PROFILE, KEY_PREFS, KEY_USER_ID,
                     "finantra_custom_income", "finantra_custom_expense"
                    ].forEach(function (k) { localStorage.removeItem(k); });
                    window.location.href = "login.html";
                }
            });
        }
    });
}


// ================================
// INIT
// ================================

(function init() {
    loadProfile();
    loadFinancialSummary();
    loadPreferences();
})();