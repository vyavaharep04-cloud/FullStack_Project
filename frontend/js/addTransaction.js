// ================================
// ELEMENT REFERENCES
// ================================

const incomeBtn       = document.getElementById("incomeBtn");
const expenseBtn      = document.getElementById("expenseBtn");
const amountInput     = document.getElementById("amountInput");
const dateInput       = document.getElementById("dateInput");
const notesInput      = document.getElementById("notesInput");
const notesCount      = document.getElementById("notesCount");
const addToListBtn    = document.getElementById("addToListBtn");
const balanceAmount   = document.getElementById("balanceAmount");

// Dropdown
const dropdownSelected = document.getElementById("dropdownSelected");
const dropdownOptions  = document.getElementById("dropdownOptions");
const dropdownArrow    = document.getElementById("dropdownArrow");
const selectedText     = document.getElementById("selectedText");

// Payment pills
const paymentPills = document.querySelectorAll(".payment-pill");

// Error elements
const amountError   = document.getElementById("amountError");
const categoryError = document.getElementById("categoryError");
const dateError     = document.getElementById("dateError");

// Session elements
const sessionCard  = document.getElementById("sessionCard");
const sessionList  = document.getElementById("sessionList");
const sessionCount = document.getElementById("sessionCount");
const totalIncome  = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const netTotal     = document.getElementById("netTotal");

// Custom category panel
const customCatPanel   = document.getElementById("customCatPanel");
const customEmojiInput = document.getElementById("customEmojiInput");
const customNameInput  = document.getElementById("customNameInput");

// Success banner
const successBanner = document.getElementById("successBanner");
const successText   = document.getElementById("successText");


// ================================
// STATE
// ================================

let currentType      = "Income";
let selectedCategory = "";
let selectedEmoji    = "";
let selectedPayment  = "Cash";
let sessionItems     = [];
const MAX_NOTES      = 150;


// ================================
// DEFAULT CATEGORIES
// ================================

const incomeCategories = [
    { emoji: "💼", label: "Salary" },
    { emoji: "💻", label: "Freelance" },
    { emoji: "📈", label: "Investment" },
    { emoji: "🎁", label: "Gift" },
    { emoji: "🏢", label: "Business" },
    { emoji: "💰", label: "Other Income" }
];

const expenseCategories = [
    { emoji: "🍕", label: "Food & Dining" },
    { emoji: "🏠", label: "Rent & Bills" },
    { emoji: "🚗", label: "Transport" },
    { emoji: "🛍️", label: "Shopping" },
    { emoji: "💊", label: "Health" },
    { emoji: "🎓", label: "Education" },
    { emoji: "🎬", label: "Entertainment" },
    { emoji: "📦", label: "Others" }
];


// ================================
// INIT
// ================================

function init() {
    dateInput.value = new Date().toISOString().split("T")[0];
    loadCategories("Income");
    loadBalance();
}

init();


// ================================
// LOAD BALANCE  ← SWAPPED
// ================================

async function loadBalance() {
    try {
        const transactions = await DataService.getTransactions();
        const prefs        = JSON.parse(localStorage.getItem("finantra_preferences")) || {};

        let balance = parseFloat(prefs.startingBalance) || 0;
        transactions.forEach(function (t) {
            balance += t.type === "Income" ? parseFloat(t.amount) : -parseFloat(t.amount);
        });

        balanceAmount.textContent = "₹ " + balance.toLocaleString("en-IN");
    } catch (err) {
        console.error("loadBalance error:", err.message);
        balanceAmount.textContent = "₹ —";
    }
}


// ================================
// INCOME / EXPENSE TOGGLE
// ================================

incomeBtn.addEventListener("click", function () {
    currentType = "Income";
    incomeBtn.classList.add("income-active");
    expenseBtn.classList.remove("expense-active");
    resetCategorySelection();
    loadCategories("Income");
});

expenseBtn.addEventListener("click", function () {
    currentType = "Expense";
    expenseBtn.classList.add("expense-active");
    incomeBtn.classList.remove("income-active");
    resetCategorySelection();
    loadCategories("Expense");
});

function resetCategorySelection() {
    selectedCategory = "";
    selectedEmoji    = "";
    selectedText.textContent = "Select category";
    dropdownSelected.classList.remove("open", "invalid");
    dropdownOptions.classList.remove("open");
    dropdownArrow.classList.remove("rotated");
    hideCustomPanel();
}


// ================================
// LOAD CATEGORIES INTO DROPDOWN
// ================================

function loadCategories(type) {
    const defaults = type === "Income" ? incomeCategories : expenseCategories;

    const storageKey = type === "Income"
        ? "finantra_custom_income"
        : "finantra_custom_expense";

    const customs = JSON.parse(localStorage.getItem(storageKey)) || [];

    dropdownOptions.innerHTML = "";

    defaults.forEach(function (cat) {
        const div = document.createElement("div");
        div.classList.add("dropdown-option");
        div.setAttribute("data-value", cat.label);
        div.innerHTML = `
            <span class="option-emoji">${cat.emoji}</span>
            <span class="option-label">${cat.label}</span>
        `;
        div.addEventListener("click", function () {
            selectCategory(cat.label, cat.emoji, div);
        });
        dropdownOptions.appendChild(div);
    });

    if (customs.length > 0) {
        const dividerCustom = document.createElement("div");
        dividerCustom.classList.add("dropdown-divider");
        dropdownOptions.appendChild(dividerCustom);
    }

    customs.forEach(function (cat) {
        const div = document.createElement("div");
        div.classList.add("dropdown-option", "custom-option");
        div.setAttribute("data-value", cat.label);
        div.innerHTML = `
            <span class="option-emoji">${cat.emoji}</span>
            <span class="option-label">${cat.label}</span>
            <button class="option-delete-btn" title="Delete this category" onclick="deleteCustomCategory(event, '${cat.label}', '${type}')">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        div.addEventListener("click", function (e) {
            if (e.target.closest(".option-delete-btn")) return;
            selectCategory(cat.label, cat.emoji, div);
        });
        dropdownOptions.appendChild(div);
    });

    const divider = document.createElement("div");
    divider.classList.add("dropdown-divider");
    dropdownOptions.appendChild(divider);

    const addCustomDiv = document.createElement("div");
    addCustomDiv.classList.add("add-custom-option");
    addCustomDiv.innerHTML = `<i class="fa-solid fa-plus"></i> Add Custom Category`;
    addCustomDiv.addEventListener("click", function () {
        closeDropdown();
        showCustomPanel();
    });
    dropdownOptions.appendChild(addCustomDiv);
}


// ================================
// SELECT CATEGORY
// ================================

function selectCategory(label, emoji, div) {
    selectedCategory = label;
    selectedEmoji    = emoji;
    selectedText.textContent = emoji + "  " + label;

    document.querySelectorAll(".dropdown-option").forEach(function (o) {
        o.classList.remove("selected");
    });
    div.classList.add("selected");

    closeDropdown();
    hideCustomPanel();
    clearError("category");
}


// ================================
// DELETE CUSTOM CATEGORY
// ================================

// async function deleteCustomCategory(event, name, type) {
//     event.stopPropagation();

//     const confirmed = confirm(`Delete custom category "${name}"?\n\nPast transactions using this category will not be affected.`);
//     if (!confirmed) return;

//     const storageKey = type === "Income"
//         ? "finantra_custom_income"
//         : "finantra_custom_expense";

//     let customs = JSON.parse(localStorage.getItem(storageKey)) || [];
//     customs = customs.filter(function (c) { return c.label !== name; });
//     localStorage.setItem(storageKey, JSON.stringify(customs));

//     if (selectedCategory === name) {
//         selectedCategory = "";
//         selectedEmoji    = "";
//         selectedText.textContent = "Select category";
//         dropdownSelected.classList.remove("invalid");
//     }

//     loadCategories(type);
// }
async function deleteCustomCategory(event, name, type) { // <-- Added async
    event.stopPropagation();

    const confirmed = confirm(`Delete custom category "${name}"?\n\nPast transactions using this category will not be affected.`);
    if (!confirmed) return;

    const storageKey = type === "Income"
        ? "finantra_custom_income"
        : "finantra_custom_expense";

    let customs = JSON.parse(localStorage.getItem(storageKey)) || [];
    customs = customs.filter(function (c) { return c.label !== name; });
    localStorage.setItem(storageKey, JSON.stringify(customs)); // Optimistic UI update

    // --- NEW SWAP CODE (Cloud Sync) ---
    try {
        const updatePayload = type === "Income" 
            ? { customIncomeCategories: customs } 
            : { customExpenseCategories: customs };
            
        await DataService.saveProfile(updatePayload); // Saves to MongoDB!
    } catch (err) {
        console.error("Failed to delete custom category from cloud:", err);
    }
    // ----------------------------------

    if (selectedCategory === name) {
        selectedCategory = "";
        selectedEmoji    = "";
        selectedText.textContent = "Select category";
        dropdownSelected.classList.remove("invalid");
    }

    loadCategories(type);
}


// ================================
// DROPDOWN OPEN / CLOSE
// ================================

function toggleDropdown() {
    dropdownOptions.classList.contains("open") ? closeDropdown() : openDropdown();
}

function openDropdown() {
    dropdownOptions.classList.add("open");
    dropdownSelected.classList.add("open");
    dropdownArrow.classList.add("rotated");
}

function closeDropdown() {
    dropdownOptions.classList.remove("open");
    dropdownSelected.classList.remove("open");
    dropdownArrow.classList.remove("rotated");
}

document.addEventListener("click", function (e) {
    const dropdown = document.getElementById("categoryDropdown");
    if (!dropdown.contains(e.target)) {
        closeDropdown();
    }
});


// ================================
// CUSTOM CATEGORY PANEL
// ================================

function showCustomPanel() {
    customCatPanel.classList.add("visible");
    customEmojiInput.focus();
}

function hideCustomPanel() {
    customCatPanel.classList.remove("visible");
    customEmojiInput.value = "";
    customNameInput.value  = "";
}

async function saveCustomCategory() {
    const emoji = customEmojiInput.value.trim();
    const name  = customNameInput.value.trim();

    if (!emoji) {
        customEmojiInput.focus();
        customEmojiInput.style.borderColor = "#dc3545";
        setTimeout(function () { customEmojiInput.style.borderColor = ""; }, 1500);
        return;
    }

    if (!name) {
        customNameInput.focus();
        customNameInput.style.borderColor = "#dc3545";
        setTimeout(function () { customNameInput.style.borderColor = ""; }, 1500);
        return;
    }

    const storageKey = currentType === "Income"
        ? "finantra_custom_income"
        : "finantra_custom_expense";

    const customs = JSON.parse(localStorage.getItem(storageKey)) || [];

    const exists = customs.some(function (c) {
        return c.label.toLowerCase() === name.toLowerCase();
    });

    if (exists) {
        alert("A category with this name already exists.");
        return;
    }

    customs.push({ emoji: emoji, label: name });
    localStorage.setItem(storageKey, JSON.stringify(customs));

    const updatePayload = currentType === "Income" 
        ? { customIncomeCategories: customs } 
        : { customExpenseCategories: customs };
        
    await DataService.saveProfile(updatePayload);

    loadCategories(currentType);

    selectedCategory = name;
    selectedEmoji    = emoji;
    selectedText.textContent = emoji + "  " + name;

    hideCustomPanel();
    clearError("category");
}


// ================================
// PAYMENT PILLS
// ================================

paymentPills.forEach(function (pill) {
    pill.addEventListener("click", function () {
        paymentPills.forEach(function (p) { p.classList.remove("active"); });
        pill.classList.add("active");
        selectedPayment = pill.getAttribute("data-method");
    });
});


// ================================
// NOTES CHARACTER COUNTER
// ================================

notesInput.addEventListener("input", function () {
    if (notesInput.value.length > MAX_NOTES) {
        notesInput.value = notesInput.value.substring(0, MAX_NOTES);
    }

    const length = notesInput.value.length;
    notesCount.textContent = length;

    notesCount.classList.remove("warn", "danger");
    if (length >= 131)      notesCount.classList.add("danger");
    else if (length >= 101) notesCount.classList.add("warn");
});


// ================================
// VALIDATION
// ================================

function validateForm() {
    let valid = true;

    if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
        amountError.classList.add("visible");
        amountInput.classList.add("invalid");
        valid = false;
    }

    if (!selectedCategory) {
        categoryError.classList.add("visible");
        dropdownSelected.classList.add("invalid");
        valid = false;
    }

    if (!dateInput.value) {
        dateError.classList.add("visible");
        dateInput.classList.add("invalid");
        valid = false;
    }

    return valid;
}

function clearError(field) {
    if (field === "amount") {
        amountError.classList.remove("visible");
        amountInput.classList.remove("invalid");
    }
    if (field === "category") {
        categoryError.classList.remove("visible");
        dropdownSelected.classList.remove("invalid");
    }
    if (field === "date") {
        dateError.classList.remove("visible");
        dateInput.classList.remove("invalid");
    }
}

amountInput.addEventListener("input", function () { clearError("amount"); });
dateInput.addEventListener("change", function () { clearError("date"); });


// ================================
// ADD TO LIST
// ================================

addToListBtn.addEventListener("click", function () {
    if (!validateForm()) return;

    const item = {
        id:       Date.now(),
        type:     currentType,
        amount:   parseFloat(amountInput.value),
        category: selectedCategory,
        emoji:    selectedEmoji || "💰",
        date:     dateInput.value,
        payment:  selectedPayment,
        notes:    notesInput.value.trim()
    };

    sessionItems.push(item);
    renderSessionList();

    sessionCard.classList.add("visible");
    successBanner.classList.remove("visible");

    resetForm();

    sessionCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
});


// ================================
// RENDER SESSION LIST
// ================================

function renderSessionList() {
    sessionList.innerHTML = "";

    sessionItems.forEach(function (item) {
        const isIncome      = item.type === "Income";
        const sign          = isIncome ? "+ ₹" : "- ₹";
        const amtClass      = isIncome ? "income" : "expense";
        const formattedDate = formatDate(item.date);

        const div = document.createElement("div");
        div.classList.add("session-item");
        div.innerHTML = `
            <div class="item-left">
                <div class="item-emoji">${item.emoji}</div>
                <div class="item-info">
                    <span class="item-category">${item.category}</span>
                    <span class="item-meta">
                        <span>${item.type}</span>
                        <span>•</span>
                        <span>${item.payment}</span>
                        <span>•</span>
                        <span>${formattedDate}</span>
                        ${item.notes ? `<span>•</span><span>${item.notes}</span>` : ""}
                    </span>
                </div>
            </div>
            <div class="item-right">
                <span class="item-amount ${amtClass}">
                    ${sign}${item.amount.toLocaleString("en-IN")}
                </span>
                <button class="item-remove" onclick="removeItem(${item.id})" title="Remove">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;

        sessionList.appendChild(div);
    });

    updateSessionTotals();
}


// ================================
// REMOVE ITEM FROM SESSION
// ================================

function removeItem(id) {
    sessionItems = sessionItems.filter(function (item) { return item.id !== id; });
    renderSessionList();

    if (sessionItems.length === 0) {
        sessionCard.classList.remove("visible");
    }
}


// ================================
// UPDATE SESSION TOTALS
// ================================

function updateSessionTotals() {
    let incomeTotal  = 0;
    let expenseTotal = 0;

    sessionItems.forEach(function (item) {
        if (item.type === "Income") incomeTotal  += item.amount;
        else                        expenseTotal += item.amount;
    });

    const net = incomeTotal - expenseTotal;

    sessionCount.textContent = sessionItems.length;
    totalIncome.textContent  = "₹ " + incomeTotal.toLocaleString("en-IN");
    totalExpense.textContent = "₹ " + expenseTotal.toLocaleString("en-IN");
    netTotal.textContent     = (net >= 0 ? "+ ₹" : "- ₹") + Math.abs(net).toLocaleString("en-IN");
    netTotal.style.color     = net >= 0 ? "#28a745" : "#dc3545";
}


// ================================
// SAVE ALL  ← SWAPPED
// ================================

async function saveAll() {
    if (sessionItems.length === 0) return;

    const btn = document.querySelector(".save-all-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }

    try {
        // Save each session item via DataService (handles both backend + guest)
        for (const item of sessionItems) {
            await DataService.addTransaction({
                type:     item.type,
                amount:   item.amount,
                category: item.category,
                emoji:    item.emoji,
                date:     item.date,
                payment:  item.payment,
                notes:    item.notes
            });
        }

        const count = sessionItems.length;
        successText.textContent = count + " transaction" + (count > 1 ? "s" : "") + " saved successfully!";
        successBanner.classList.add("visible");

        sessionItems = [];
        sessionCard.classList.remove("visible");

        loadBalance();

        successBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });

        setTimeout(function () {
            successBanner.classList.remove("visible");
        }, 4000);

    } catch (err) {
        console.error("saveAll error:", err.message);
        alert("Failed to save transactions: " + err.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Save All"; }
    }
}


// ================================
// CLEAR ALL
// ================================

function clearAll() {
    if (sessionItems.length === 0) return;

    openModal({
        icon:         "🗑️",
        title:        "Clear Session?",
        message:      `You have <strong>${sessionItems.length} unsaved transaction${sessionItems.length > 1 ? "s" : ""}</strong>.<br><br>These will not be saved.`,
        confirmText:  "Clear All",
        confirmClass: "",
        onConfirm: function () {
            sessionItems = [];
            sessionCard.classList.remove("visible");
        }
    });
}


// ================================
// RESET FORM
// ================================

function resetForm() {
    amountInput.value      = "";
    notesInput.value       = "";
    notesCount.textContent = "0";
    notesCount.classList.remove("warn", "danger");

    dateInput.value = new Date().toISOString().split("T")[0];

    selectedCategory = "";
    selectedEmoji    = "";
    selectedText.textContent = "Select category";
    document.querySelectorAll(".dropdown-option").forEach(function (o) {
        o.classList.remove("selected");
    });

    paymentPills.forEach(function (p) { p.classList.remove("active"); });
    document.querySelector('[data-method="Cash"]').classList.add("active");
    selectedPayment = "Cash";

    clearError("amount");
    clearError("category");
    clearError("date");

    amountInput.focus();
}


// ================================
// FORMAT DATE
// ================================

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const [year, month, day] = dateStr.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"];
    return day + " " + months[parseInt(month) - 1] + " " + year;
}