// ================================
// BUDGET PLANNER — JS
// FinanTra | Smart Tools
// ================================


// ================================
// DEFAULT EXPENSE CATEGORIES
// (mirrors addTransaction.js)
// ================================

var DEFAULT_EXPENSE_CATS = [
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
// STATE
// ================================

var viewYear  = new Date().getFullYear();
var viewMonth = new Date().getMonth(); // 0-indexed
var isCurrentMonth = true;


// ================================
// STORAGE HELPERS
// ================================

function getBudgetKey(year, month) {
    return "finantra_budget_" + year + "_" + String(month + 1).padStart(2, "0");
}

function loadBudgetData(year, month) {
    var key  = getBudgetKey(year, month);
    var data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
    // Default structure
    return { cap: 0, categories: [] };
}

function saveBudgetData(year, month, data) {
    var key = getBudgetKey(year, month);
    localStorage.setItem(key, JSON.stringify(data));
}

// Returns all months (year_month strings) that have saved budget data
function getSavedBudgetMonths() {
    var months = [];
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf("finantra_budget_") === 0) {
            var parts = key.replace("finantra_budget_", "").split("_");
            if (parts.length === 2) {
                months.push({ year: parseInt(parts[0]), month: parseInt(parts[1]) - 1 });
            }
        }
    }
    return months;
}


// ================================
// TRANSACTION HELPERS
// ================================

function getTransactions() {
    return JSON.parse(localStorage.getItem("finantra_transactions")) || [];
}

function getMonthTransactions(year, month) {
    var all = getTransactions();
    var prefix = year + "-" + String(month + 1).padStart(2, "0");
    return all.filter(function (t) {
        return t.date && t.date.indexOf(prefix) === 0;
    });
}

// Build map: category → total spent (expenses only) for given month
function buildSpendingMap(year, month) {
    var txns = getMonthTransactions(year, month);
    var map  = {};
    txns.forEach(function (t) {
        if (t.type === "Expense") {
            map[t.category] = (map[t.category] || 0) + parseFloat(t.amount);
        }
    });
    return map;
}

// Total income for month
function getMonthIncome(year, month) {
    var txns = getMonthTransactions(year, month);
    var total = 0;
    txns.forEach(function (t) {
        if (t.type === "Income") total += parseFloat(t.amount);
    });
    return total;
}

// All expense categories found in transactions (defaults + customs + used ones in txns)
function getAllKnownExpenseCategories() {
    var cats = {};

    // 1 — defaults
    DEFAULT_EXPENSE_CATS.forEach(function (c) {
        cats[c.label] = c.emoji;
    });

    // 2 — custom expense categories
    var customs = JSON.parse(localStorage.getItem("finantra_custom_expense")) || [];
    customs.forEach(function (c) {
        cats[c.label] = c.emoji;
    });

    // 3 — any expense category found in transactions not already listed
    var txns = getTransactions();
    txns.forEach(function (t) {
        if (t.type === "Expense" && !cats[t.category]) {
            cats[t.category] = t.emoji || "📦";
        }
    });

    return cats; // { label: emoji }
}


// ================================
// DOM REFERENCES
// ================================

var bpMonthLabel    = document.getElementById("bpMonthLabel");
var bpMonthBadge    = document.getElementById("bpMonthBadge");
var bpPrevBtn       = document.getElementById("bpPrevMonth");
var bpNextBtn       = document.getElementById("bpNextMonth");

var bpTotalIncome   = document.getElementById("bpTotalIncome");
var bpTotalSpent    = document.getElementById("bpTotalSpent");
var bpTotalBudget   = document.getElementById("bpTotalBudget");
var bpTotalRemain   = document.getElementById("bpTotalRemaining");

var bpCapInput      = document.getElementById("bpCapInput");
var bpCapSaveBtn    = document.getElementById("bpCapSaveBtn");
var bpCapBarWrap    = document.getElementById("bpCapBarWrap");
var bpCapFill       = document.getElementById("bpCapFill");
var bpCapSpent      = document.getElementById("bpCapSpent");
var bpCapPct        = document.getElementById("bpCapPct");
var bpCapLeft       = document.getElementById("bpCapLeft");
var bpCapAlert      = document.getElementById("bpCapAlert");

var bpDailyAmount   = document.getElementById("bpDailyAmount");
var bpDaysLeft      = document.getElementById("bpDaysLeft");
var bpSpentToday    = document.getElementById("bpSpentToday");
var bpAvgDaily      = document.getElementById("bpAvgDaily");

var bpCatList       = document.getElementById("bpCatList");
var bpCatEmpty      = document.getElementById("bpCatEmpty");
var bpAddCatBtn     = document.getElementById("bpAddCatBtn");
var bpAddCatPanel   = document.getElementById("bpAddCatPanel");
var bpCatSelect     = document.getElementById("bpCatSelect");
var bpCatLimitInput = document.getElementById("bpCatLimitInput");
var bpAddCatConfirm = document.getElementById("bpAddCatConfirm");
var bpAddCatCancel  = document.getElementById("bpAddCatCancel");
var bpAddCatError   = document.getElementById("bpAddCatError");

var bpBulkEditBtn   = document.getElementById("bpBulkEditBtn");
var bpBulkOverlay   = document.getElementById("bpBulkOverlay");
var bpBulkBody      = document.getElementById("bpBulkBody");
var bpBulkClose     = document.getElementById("bpBulkClose");
var bpBulkCancel    = document.getElementById("bpBulkCancel");
var bpBulkSave      = document.getElementById("bpBulkSave");

var bpUnbudgetedCard = document.getElementById("bpUnbudgetedCard");
var bpUnbudgetedList = document.getElementById("bpUnbudgetedList");
var bpUnbudgetedEmpty = document.getElementById("bpUnbudgetedEmpty");

var bpResetOverlay  = document.getElementById("bpResetOverlay");
var bpResetKeep     = document.getElementById("bpResetKeep");
var bpResetFresh    = document.getElementById("bpResetFresh");
var bpResetMsg      = document.getElementById("bpResetMsg");
var bpResetSub      = document.getElementById("bpResetSub");


// ================================
// FORMAT HELPERS
// ================================

var MONTH_NAMES = ["January","February","March","April","May","June",
                   "July","August","September","October","November","December"];

function fmtINR(n) {
    return "₹ " + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function getStatusClass(pct) {
    if (pct >= 100) return "over";
    if (pct >= 75)  return "warn";
    return "safe";
}

function getStatusLabel(pct) {
    if (pct >= 100) return "Over Budget";
    if (pct >= 75)  return "Warning";
    return "Safe";
}


// ================================
// MONTH NAVIGATION
// ================================

function renderMonthLabel() {
    var now = new Date();
    var cy  = now.getFullYear();
    var cm  = now.getMonth();

    bpMonthLabel.textContent = MONTH_NAMES[viewMonth] + " " + viewYear;

    isCurrentMonth = (viewYear === cy && viewMonth === cm);

    bpMonthBadge.textContent = isCurrentMonth ? "Current Month" : "History";
    bpMonthBadge.className   = "bp-month-badge" + (isCurrentMonth ? "" : " history");

    // Disable next if current month
    bpNextBtn.disabled = isCurrentMonth;

    // Disable prev if no earlier saved data
    var saved = getSavedBudgetMonths();
    var prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    var prevM = viewMonth === 0 ? 11 : viewMonth - 1;
    var hasPrev = saved.some(function (s) { return s.year === prevY && s.month === prevM; });
    // Also allow prev if current month has no data but prev does
    bpPrevBtn.disabled = !hasPrev && !isCurrentMonth;
}

bpPrevBtn.addEventListener("click", function () {
    if (viewMonth === 0) { viewYear--; viewMonth = 11; }
    else                 { viewMonth--; }
    renderPage();
});

bpNextBtn.addEventListener("click", function () {
    if (viewMonth === 11) { viewYear++; viewMonth = 0; }
    else                  { viewMonth++; }
    renderPage();
});


// ================================
// SUMMARY CARDS
// ================================

function renderSummaryCards(data, spendingMap) {
    var income  = getMonthIncome(viewYear, viewMonth);
    var spent   = Object.values(spendingMap).reduce(function (a, b) { return a + b; }, 0);
    var budgeted = data.categories.reduce(function (s, c) { return s + (c.limit || 0); }, 0);
    var remaining = budgeted - spent;

    bpTotalIncome.textContent  = fmtINR(income);
    bpTotalSpent.textContent   = fmtINR(spent);
    bpTotalBudget.textContent  = fmtINR(budgeted);
    bpTotalRemain.textContent  = fmtINR(remaining);
    bpTotalRemain.style.color  = remaining >= 0 ? "#28a745" : "#dc3545";
}


// ================================
// BUDGET CAP SECTION
// ================================

function renderCapSection(data, spendingMap) {
    var cap   = data.cap || 0;
    var spent = Object.values(spendingMap).reduce(function (a, b) { return a + b; }, 0);

    // Show current cap in input if set
    bpCapInput.value = cap > 0 ? cap : "";

    if (cap > 0) {
        var pct = Math.min(Math.round((spent / cap) * 100), 999);
        var cls = getStatusClass(pct);

        bpCapBarWrap.classList.add("visible");
        bpCapFill.style.width = Math.min(pct, 100) + "%";
        bpCapFill.className   = "bp-progress-fill " + (cls === "safe" ? "" : cls);
        bpCapSpent.textContent = "Spent: " + fmtINR(spent);
        bpCapPct.textContent   = pct + "%";
        bpCapLeft.textContent  = "Left: " + fmtINR(cap - spent);

        // Alert
        bpCapAlert.className = "bp-alert";
        if (pct >= 100) {
            bpCapAlert.classList.add("visible", "danger");
            bpCapAlert.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Monthly cap exceeded by ' + fmtINR(spent - cap) + '!';
        } else if (pct >= 75) {
            bpCapAlert.classList.add("visible", "warn");
            bpCapAlert.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + pct + '% of monthly budget used. Only ' + fmtINR(cap - spent) + ' remaining.';
        } else {
            bpCapAlert.classList.add("visible", "safe");
            bpCapAlert.innerHTML = '<i class="fa-solid fa-circle-check"></i> On track! ' + fmtINR(cap - spent) + ' remaining of your monthly budget.';
        }
    } else {
        bpCapBarWrap.classList.remove("visible");
        bpCapAlert.className = "bp-alert";
    }
}

bpCapSaveBtn.addEventListener("click", function () {
    var val = parseFloat(bpCapInput.value);
    if (isNaN(val) || val < 0) {
        bpCapInput.style.borderColor = "#dc3545";
        setTimeout(function () { bpCapInput.style.borderColor = ""; }, 1500);
        return;
    }
    var data  = loadBudgetData(viewYear, viewMonth);
    data.cap  = val;
    saveBudgetData(viewYear, viewMonth, data);
    renderPage();
});

bpCapInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") bpCapSaveBtn.click();
});


// ================================
// DAILY GUIDANCE
// ================================

function renderDailyGuidance(data, spendingMap) {
    var now   = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!isCurrentMonth) {
        bpDailyAmount.textContent = "N/A";
        bpDaysLeft.textContent    = "—";
        bpSpentToday.textContent  = "—";
        bpAvgDaily.textContent    = "—";
        return;
    }

    // Days left including today
    var lastDay    = new Date(viewYear, viewMonth + 1, 0).getDate();
    var daysLeft   = lastDay - now.getDate() + 1;
    var daysElapsed = now.getDate();

    // Total spent this month
    var spent = Object.values(spendingMap).reduce(function (a, b) { return a + b; }, 0);

    // Spent today
    var todayStr = now.toISOString().split("T")[0];
    var txns     = getTransactions();
    var todaySpent = 0;
    txns.forEach(function (t) {
        if (t.type === "Expense" && t.date === todayStr) {
            todaySpent += parseFloat(t.amount);
        }
    });

    // Cap-based daily guidance
    var cap       = data.cap || 0;
    var remaining = cap > 0 ? Math.max(cap - spent, 0) : 0;
    var daily     = cap > 0 ? Math.round(remaining / daysLeft) : 0;

    // Avg daily spend so far
    var avg = daysElapsed > 0 ? Math.round(spent / daysElapsed) : 0;

    bpDaysLeft.textContent    = daysLeft + " days";
    bpSpentToday.textContent  = fmtINR(todaySpent);
    bpAvgDaily.textContent    = fmtINR(avg);
    bpDailyAmount.textContent = cap > 0 ? fmtINR(daily) : "Set a budget cap";
    bpDailyAmount.style.fontSize = cap > 0 ? "" : "1.2rem";
}


// ================================
// CATEGORY ROWS
// ================================

function renderCategoryRows(data, spendingMap) {
    bpCatList.innerHTML = "";

    if (data.categories.length === 0) {
        bpCatEmpty.classList.add("visible");
        return;
    }

    bpCatEmpty.classList.remove("visible");

    data.categories.forEach(function (cat, idx) {
        var spent  = spendingMap[cat.label] || 0;
        var limit  = cat.limit || 0;
        var pct    = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 999) : 0;
        var cls    = limit > 0 ? getStatusClass(pct) : "no-data";
        var label  = limit > 0 ? getStatusLabel(pct) + " (" + pct + "%)" : "No limit set";

        var row = document.createElement("div");
        row.className    = "bp-cat-row";
        row.dataset.idx  = idx;

        row.innerHTML =
            '<div class="bp-cat-top">' +
                '<span class="bp-cat-emoji">' + cat.emoji + '</span>' +
                '<span class="bp-cat-name">' + cat.label + '</span>' +
                '<span class="bp-cat-status ' + cls + '">' + label + '</span>' +
                '<button class="bp-cat-delete" title="Remove category" onclick="removeCatRow(' + idx + ')">' +
                    '<i class="fa-solid fa-trash-can"></i>' +
                '</button>' +
            '</div>' +
            '<div class="bp-cat-limit-row">' +
                '<div class="bp-cat-limit-display" id="bpLimitDisplay_' + idx + '" onclick="showInlineEdit(' + idx + ')">' +
                    '<i class="fa-solid fa-pen-to-square"></i> Limit: ' + (limit > 0 ? fmtINR(limit) : "Not set") +
                '</div>' +
                '<div class="bp-cat-inline-edit" id="bpInlineEdit_' + idx + '">' +
                    '<span class="bp-rupee" style="font-size:13px;">₹</span>' +
                    '<input type="number" class="bp-cat-inline-input" id="bpInlineInput_' + idx + '"' +
                        ' value="' + (limit || "") + '" placeholder="Set limit" min="0" step="100" />' +
                    '<button class="bp-cat-inline-save" onclick="saveInlineLimit(' + idx + ')">' +
                        '<i class="fa-solid fa-check"></i>' +
                    '</button>' +
                    '<button class="bp-cat-inline-cancel" onclick="hideInlineEdit(' + idx + ')">' +
                        '<i class="fa-solid fa-xmark"></i>' +
                    '</button>' +
                '</div>' +
                '<span class="bp-cat-spent-info">Spent: ' + fmtINR(spent) + (limit > 0 ? ' / ' + fmtINR(limit) : '') + '</span>' +
            '</div>';

        // Progress bar (only if limit set)
        if (limit > 0) {
            var fillCls = cls === "safe" ? "" : cls;
            row.innerHTML +=
                '<div class="bp-cat-bar-row">' +
                    '<div class="bp-cat-bar-labels">' +
                        '<span>' + fmtINR(spent) + ' spent</span>' +
                        '<span>' + fmtINR(Math.max(limit - spent, 0)) + ' remaining</span>' +
                    '</div>' +
                    '<div class="bp-progress-bar">' +
                        '<div class="bp-progress-fill ' + fillCls + '" style="width:' + Math.min(pct, 100) + '%"></div>' +
                    '</div>' +
                '</div>';
        }

        // Enter key on inline input
        bpCatList.appendChild(row);
        setTimeout(function () {
            var inp = document.getElementById("bpInlineInput_" + idx);
            if (inp) {
                inp.addEventListener("keydown", function (e) {
                    if (e.key === "Enter")  saveInlineLimit(idx);
                    if (e.key === "Escape") hideInlineEdit(idx);
                });
            }
        }, 0);
    });
}

function showInlineEdit(idx) {
    document.getElementById("bpLimitDisplay_" + idx).style.display = "none";
    document.getElementById("bpInlineEdit_" + idx).classList.add("visible");
    var inp = document.getElementById("bpInlineInput_" + idx);
    if (inp) { inp.focus(); inp.select(); }
}

function hideInlineEdit(idx) {
    document.getElementById("bpLimitDisplay_" + idx).style.display = "";
    document.getElementById("bpInlineEdit_" + idx).classList.remove("visible");
}

function saveInlineLimit(idx) {
    var inp  = document.getElementById("bpInlineInput_" + idx);
    var val  = parseFloat(inp.value);
    if (isNaN(val) || val < 0) {
        inp.style.borderColor = "#dc3545";
        setTimeout(function () { inp.style.borderColor = ""; }, 1200);
        return;
    }
    var data = loadBudgetData(viewYear, viewMonth);
    data.categories[idx].limit = val;
    saveBudgetData(viewYear, viewMonth, data);
    renderPage();
}

function removeCatRow(idx) {
    var data = loadBudgetData(viewYear, viewMonth);
    var cat  = data.categories[idx];
    openModal({
        icon:         "🗑️",
        title:        "Remove Category?",
        message:      'Remove <strong>' + cat.emoji + ' ' + cat.label + '</strong> from this month\'s budget?<br><br>Your transactions won\'t be affected.',
        confirmText:  "Remove",
        confirmClass: "",
        onConfirm: function () {
            data.categories.splice(idx, 1);
            saveBudgetData(viewYear, viewMonth, data);
            renderPage();
        }
    });
}


// ================================
// ADD CATEGORY PANEL
// ================================

function populateCatSelect(data) {
    var allCats = getAllKnownExpenseCategories();
    var added   = data.categories.map(function (c) { return c.label; });

    bpCatSelect.innerHTML = '<option value="">— Select a category —</option>';

    Object.keys(allCats).forEach(function (label) {
        if (added.indexOf(label) !== -1) return; // already added
        var opt = document.createElement("option");
        opt.value       = label;
        opt.textContent = allCats[label] + "  " + label;
        bpCatSelect.appendChild(opt);
    });
}

bpAddCatBtn.addEventListener("click", function () {
    var data = loadBudgetData(viewYear, viewMonth);
    populateCatSelect(data);
    bpAddCatPanel.classList.toggle("visible");
    bpAddCatError.classList.remove("visible");
    bpCatLimitInput.value = "";
    bpCatSelect.value = "";
    if (bpAddCatPanel.classList.contains("visible")) {
        bpCatSelect.focus();
    }
});

bpAddCatCancel.addEventListener("click", function () {
    bpAddCatPanel.classList.remove("visible");
});

bpAddCatConfirm.addEventListener("click", function () {
    var label = bpCatSelect.value;
    var limit = parseFloat(bpCatLimitInput.value);

    bpAddCatError.classList.remove("visible");

    if (!label) {
        bpAddCatError.textContent = "Please select a category.";
        bpAddCatError.classList.add("visible");
        return;
    }
    if (isNaN(limit) || limit <= 0) {
        bpAddCatError.textContent = "Please enter a valid budget limit.";
        bpAddCatError.classList.add("visible");
        return;
    }

    var allCats = getAllKnownExpenseCategories();
    var emoji   = allCats[label] || "📦";

    var data = loadBudgetData(viewYear, viewMonth);
    data.categories.push({ label: label, emoji: emoji, limit: limit });
    saveBudgetData(viewYear, viewMonth, data);

    bpAddCatPanel.classList.remove("visible");
    renderPage();
});

bpCatLimitInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") bpAddCatConfirm.click();
});


// ================================
// UNBUDGETED CATEGORIES
// ================================

function renderUnbudgeted(data, spendingMap) {
    var budgetedLabels = data.categories.map(function (c) { return c.label; });
    var unbudgeted     = [];

    Object.keys(spendingMap).forEach(function (label) {
        if (budgetedLabels.indexOf(label) === -1 && spendingMap[label] > 0) {
            var allCats = getAllKnownExpenseCategories();
            unbudgeted.push({
                label: label,
                emoji: allCats[label] || "📦",
                spent: spendingMap[label]
            });
        }
    });

    bpUnbudgetedList.innerHTML = "";

    if (unbudgeted.length === 0) {
        bpUnbudgetedEmpty.classList.add("visible");
        return;
    }

    bpUnbudgetedEmpty.classList.remove("visible");

    unbudgeted.forEach(function (cat) {
        var row = document.createElement("div");
        row.className = "bp-unbudgeted-row";
        row.innerHTML =
            '<span class="bp-cat-emoji">' + cat.emoji + '</span>' +
            '<div class="bp-unbudgeted-info">' +
                '<div class="bp-unbudgeted-name">' + cat.label + '</div>' +
                '<div class="bp-unbudgeted-spent">Spent this month: ' + fmtINR(cat.spent) + '</div>' +
            '</div>' +
            '<button class="bp-unbudgeted-add" onclick="quickAddFromUnbudgeted(\'' + cat.label.replace(/'/g, "\\'") + '\')">+ Set Budget</button>';
        bpUnbudgetedList.appendChild(row);
    });
}

function quickAddFromUnbudgeted(label) {
    var data = loadBudgetData(viewYear, viewMonth);
    populateCatSelect(data);
    bpAddCatPanel.classList.add("visible");
    bpCatSelect.value = label;
    bpCatLimitInput.focus();
    bpAddCatPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}


// ================================
// BULK EDIT MODAL
// ================================

bpBulkEditBtn.addEventListener("click", function () {
    var data = loadBudgetData(viewYear, viewMonth);
    if (data.categories.length === 0) {
        openModal({
            icon:        "ℹ️",
            title:       "No Categories Yet",
            message:     "Add some category budgets first, then use Bulk Edit to update them all at once.",
            confirmText: "Got it",
            confirmClass: "primary",
            onConfirm:   function () {}
        });
        return;
    }

    bpBulkBody.innerHTML = "";
    data.categories.forEach(function (cat, idx) {
        var row = document.createElement("div");
        row.className = "bp-bulk-row";
        row.innerHTML =
            '<div class="bp-bulk-cat-name">' +
                '<span>' + cat.emoji + '</span>' + cat.label +
            '</div>' +
            '<div class="bp-bulk-input-wrap">' +
                '<span>₹</span>' +
                '<input type="number" class="bp-bulk-input" id="bpBulkIn_' + idx + '"' +
                    ' value="' + (cat.limit || "") + '" placeholder="0" min="0" step="100" />' +
            '</div>';
        bpBulkBody.appendChild(row);
    });

    bpBulkOverlay.classList.add("active");
});

function closeBulkModal() {
    bpBulkOverlay.classList.remove("active");
}

bpBulkClose.addEventListener("click",  closeBulkModal);
bpBulkCancel.addEventListener("click", closeBulkModal);

bpBulkOverlay.addEventListener("click", function (e) {
    if (e.target === bpBulkOverlay) closeBulkModal();
});

bpBulkSave.addEventListener("click", function () {
    var data = loadBudgetData(viewYear, viewMonth);
    data.categories.forEach(function (cat, idx) {
        var inp = document.getElementById("bpBulkIn_" + idx);
        if (inp) {
            var val = parseFloat(inp.value);
            cat.limit = isNaN(val) || val < 0 ? 0 : val;
        }
    });
    saveBudgetData(viewYear, viewMonth, data);
    closeBulkModal();
    renderPage();
});


// ================================
// MONTHLY RESET DIALOG
// Shows when current month has no
// budget data but previous month does
// ================================

function checkNewMonth() {
    if (!isCurrentMonth) return;

    var key  = getBudgetKey(viewYear, viewMonth);
    var data = localStorage.getItem(key);

    // Already has data for current month — no reset needed
    if (data) return;

    // Check if previous month has budget data
    var prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    var prevM = viewMonth === 0 ? 11 : viewMonth - 1;
    var prevData = localStorage.getItem(getBudgetKey(prevY, prevM));

    if (!prevData) return; // No previous data either — first time user

    var parsed = JSON.parse(prevData);
    if (!parsed || parsed.categories.length === 0) return;

    // Show reset dialog
    bpResetMsg.textContent = "It's " + MONTH_NAMES[viewMonth] + "! What would you like to do with your budgets?";
    bpResetSub.textContent = MONTH_NAMES[prevM] + "'s budgets have been saved in history.";
    bpResetOverlay.classList.add("active");
}

bpResetKeep.addEventListener("click", function () {
    // Copy previous month's category limits to current month
    var prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    var prevM = viewMonth === 0 ? 11 : viewMonth - 1;
    var prevData = loadBudgetData(prevY, prevM);

    var newData = {
        cap:        prevData.cap || 0,
        categories: prevData.categories.map(function (c) {
            return { label: c.label, emoji: c.emoji, limit: c.limit };
        })
    };

    saveBudgetData(viewYear, viewMonth, newData);
    bpResetOverlay.classList.remove("active");
    renderPage();
});

bpResetFresh.addEventListener("click", function () {
    // Save empty data for current month
    saveBudgetData(viewYear, viewMonth, { cap: 0, categories: [] });
    bpResetOverlay.classList.remove("active");
    renderPage();
});


// ================================
// MAIN RENDER
// ================================

function renderPage() {
    renderMonthLabel();

    var data        = loadBudgetData(viewYear, viewMonth);
    var spendingMap = buildSpendingMap(viewYear, viewMonth);

    renderSummaryCards(data, spendingMap);
    renderCapSection(data, spendingMap);
    renderDailyGuidance(data, spendingMap);
    renderCategoryRows(data, spendingMap);
    renderUnbudgeted(data, spendingMap);
}


// ================================
// INIT
// ================================

(function init() {
    renderPage();
    checkNewMonth();
})();