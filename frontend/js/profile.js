// ================================
// PROFILE PAGE — profile.js
// Handles: identity, personal info,
// financial summary, preferences,
// dark mode, data management
// ================================


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
// GENERATE USER ID (guest fallback)
// ================================

function generateUserId() {
    const year   = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return "FT-" + year + "-" + random;
}

function getOrCreateUserId() {
    let id = localStorage.getItem("finantra_user_id");
    if (!id) {
        id = generateUserId();
        localStorage.setItem("finantra_user_id", id);
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
// UPDATE AVATAR DISPLAY
// ================================

function updateAvatarDisplay(name) {
    const circle   = document.getElementById("avatarCircle");
    const initials = document.getElementById("avatarInitials");

    initials.textContent     = getInitials(name);
    circle.style.background  = getAvatarColor(name) + "55";
    circle.style.borderColor = getAvatarColor(name) + "88";
}

// Live update as user types name
function updateAvatarLive() {
    const name = document.getElementById("inputName").value;
    updateAvatarDisplay(name);
    document.getElementById("profileDisplayName").textContent = name || "Your Name";
}


// ================================
// LOAD PROFILE DATA
// ================================

async function loadProfile() {
    try {
        const profile = await DataService.getProfile();
        const userId  = profile.userId || getOrCreateUserId();

        const name = profile.name || "";
        updateAvatarDisplay(name);
        document.getElementById("profileDisplayName").textContent = name || "Your Name";
        document.getElementById("profileUserId").textContent      = userId;
        document.getElementById("memberSince").textContent        =
            "Member since " + (profile.memberSince || formatMemberSince(new Date().toISOString()));

        // Fill form fields
        document.getElementById("inputName").value  = profile.name  || "";
        document.getElementById("inputEmail").value = profile.email || "";
        document.getElementById("inputPhone").value = profile.phone || "";

    } catch (err) {
        console.error("loadProfile error:", err);
    }
}


// ================================
// SAVE PERSONAL INFO
// ================================

async function savePersonalInfo() {
    try {
        const updates = {
            name:  document.getElementById("inputName").value.trim(),
            email: document.getElementById("inputEmail").value.trim(),
            phone: document.getElementById("inputPhone").value.trim()
        };

        await DataService.saveProfile(updates);

        // Update display name
        document.getElementById("profileDisplayName").textContent =
            updates.name || "Your Name";

        showSaveMsg("personalSaveMsg");

    } catch (err) {
        console.error("savePersonalInfo error:", err);
    }
}


// ================================
// LOAD FINANCIAL SUMMARY
// ================================

async function loadFinancialSummary() {
    try {
        const transactions = await DataService.getTransactions();

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

    } catch (err) {
        console.error("loadFinancialSummary error:", err);
    }
}


// ================================
// LOAD PREFERENCES
// ================================

async function loadPreferences() {
    try {
        const profile = await DataService.getProfile();
        const prefs   = profile.preferences || {};

        document.getElementById("prefFilter").value  = prefs.defaultFilter || "monthly";
        document.getElementById("prefBalance").value = prefs.startingBalance || "";

        // Theme is always read from localStorage (intentional — stays local)
        const theme = prefs.theme || localStorage.getItem("finantra_preferences")
            ? (JSON.parse(localStorage.getItem("finantra_preferences") || "{}").theme || "light")
            : "light";
        applyTheme(theme, false);

    } catch (err) {
        console.error("loadPreferences error:", err);
    }
}


// ================================
// SAVE PREFERENCES
// ================================

async function savePreferences() {
    try {
        // Read current theme from localStorage (theme is always local)
        const localPrefs = JSON.parse(localStorage.getItem("finantra_preferences") || "{}");

        const preferences = {
            defaultFilter:   document.getElementById("prefFilter").value,
            startingBalance: parseFloat(document.getElementById("prefBalance").value) || 0,
            theme:           localPrefs.theme || "light"
        };

        await DataService.saveProfile({ preferences });
        showSaveMsg("prefSaveMsg");

    } catch (err) {
        console.error("savePreferences error:", err);
    }
}


// ================================
// THEME TOGGLE
// Theme is always stored in localStorage only
// (no backend route for theme — intentional per project design)
// ================================

function setTheme(theme) {
    applyTheme(theme, true);
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
        const prefs = JSON.parse(localStorage.getItem("finantra_preferences") || "{}");
        prefs.theme = theme;
        localStorage.setItem("finantra_preferences", JSON.stringify(prefs));
    }
}

// Must stay sync — runs before page paint
(function applySavedTheme() {
    const prefs = JSON.parse(localStorage.getItem("finantra_preferences") || "{}");
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
// No bulk-delete API route exists — guests use localStorage,
// logged-in users see a "not supported" notice via modal.
// ================================

function clearTransactions() {
    if (DataService.isGuest()) {
        // Guest mode — safe to wipe localStorage directly
        openModal({
            icon:         "🗑️",
            title:        "Clear All Transactions?",
            message:      "This will permanently delete all your saved transactions.<br><br>This action <strong>cannot be undone</strong>.",
            confirmText:  "Clear Transactions",
            confirmClass: "",
            onConfirm: async function () {
                localStorage.removeItem("finantra_transactions");
                await loadFinancialSummary();
                showSaveMsg("personalSaveMsg");
            }
        });
    } else {
        // Logged-in — no bulk-delete route on backend
        openModal({
            icon:         "ℹ️",
            title:        "Not Available",
            message:      "Bulk transaction deletion is not supported for logged-in accounts.<br><br>You can delete individual transactions from the <strong>Transactions</strong> page.",
            confirmText:  "Go to Transactions",
            confirmClass: "primary",
            onConfirm: function () {
                window.location.href = "transactions.html";
            }
        });
    }
}


// ================================
// DATA MANAGEMENT — RESET APP
// ================================

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
                    // DataService.logout() clears all finantra_* keys and redirects to login.html
                    DataService.logout();
                }
            });
        }
    });
}


// ================================
// INIT
// ================================

(async function init() {
    await loadProfile();
    await loadFinancialSummary();
    await loadPreferences();
})();