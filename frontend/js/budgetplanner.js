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

// Used only for:
//  1. Cap (no backend field — stays in localStorage always)
//  2. getSavedBudgetMonths (scans keys — no DataService equivalent)

function getCapKey(year, month) {
    return "finantra_budget_cap_" + year + "_" + String(month + 1).padStart(2, "0");
}

// Legacy key used by getSavedBudgetMonths to detect prior-month data
function getBudgetKey(year, month) {
    return "finantra_budget_" + year + "_" + String(month + 1).padStart(2, "0");
}

function loadCap(year, month) {
    var val = localStorage.getItem(getCapKey(year, month));
    return val ? parseFloat(val) : 0;
}

function saveCap(year, month, cap) {
    localStorage.setItem(getCapKey(year, month), cap);
}

// Returns months that have saved budget data.
// Checks both the legacy key (guest mode) and the new cap key (logged-in mode).
// For logged-in users prev-month detection is best-effort via cap keys only
// because we can't enumerate backend data synchronously.
function getSavedBudgetMonths() {
    var months = [];
    var seen   = {};
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        // Match legacy guest key OR new cap key
        var match =
            (key && key.indexOf("finantra_budget_") === 0 && key.indexOf("finantra_budget_cap_") === -1)
                ? key.replace("finantra_budget_", "").split("_")
            : (key && key.indexOf("finantra_budget_cap_") === 0)
                ? key.replace("finantra_budget_cap_", "").split("_")
            : null;

        if (match && match.length === 2) {
            var mk = match[0] + "_" + match[1];
            if (!seen[mk]) {
                seen[mk] = true;
                months.push({ year: parseInt(match[0]), month: parseInt(match[1]) - 1 });
            }
        }
    }
    return months;
}

// ================================
// DATASERVICE BUDGET HELPERS
// ================================
// DataService.getBudget returns:
//   { year, month, categories: [{ category, emoji, limit }] }
// Internally we use { label, emoji, limit } — so we normalise on load
// and denormalise on save.

function normaliseCats(rawCats) {
    // rawCats may be undefined (new month) or [] or [{ category, emoji, limit }]
    if (!rawCats) return [];
    return rawCats.map(function (c) {
        return { label: c.category || c.label || "", emoji: c.emoji || "📦", limit: c.limit || 0 };
    });
}

function denormaliseCats(cats) {
    return cats.map(function (c) {
        return { category: c.label, emoji: c.emoji, limit: c.limit };
    });
}

async function loadBudgetData(year, month) {
    try {
        // DataService.getBudget uses 1-indexed month internally
        var raw = await DataService.getBudget(year, month + 1);
        var cap = loadCap(year, month);
        return {
            cap:        cap,
            categories: normaliseCats(raw && raw.categories ? raw.categories : [])
        };
    } catch (err) {
        console.error("loadBudgetData error:", err);
        return { cap: loadCap(year, month), categories: [] };
    }
}

async function saveBudgetData(year, month, data) {
    try {
        // Persist cap locally (no backend field)
        saveCap(year, month, data.cap || 0);
        // Persist categories via DataService (1-indexed month)
        await DataService.saveBudget(year, month + 1, denormaliseCats(data.categories));
        // Also write a sentinel key so getSavedBudgetMonths can detect this month
        // (only needed for guest fallback — logged-in path works via cap key)
        if (DataService.isGuest()) {
            var key = getBudgetKey(year, month);
            localStorage.setItem(key, JSON.stringify(data));
        }
    } catch (err) {
        console.error("saveBudgetData error:", err);
    }
}


// ================================
// TRANSACTION HELPERS
// ================================

async function getMonthTransactions(year, month) {
    var all    = await DataService.getTransactions();
    var prefix = year + "-" + String(month + 1).padStart(2, "0");
    return all.filter(function (t) {
        return t.date && t.date.indexOf(prefix) === 0;
    });
}

// Build map: category → total spent (expenses only) for given month
async function buildSpendingMap(year, month) {
    var txns = await getMonthTransactions(year, month);
    var map  = {};
    txns.forEach(function (t) {
        if (t.type === "Expense") {
            map[t.category] = (map[t.category] || 0) + parseFloat(t.amount);
        }
    });
    return map;
}

// Total income for month
async function getMonthIncome(year, month) {
    var txns  = await getMonthTransactions(year, month);
    var total = 0;
    txns.forEach(function (t) {
        if (t.type === "Income") total += parseFloat(t.amount);
    });
    return total;
}

// All expense categories found in transactions (defaults + customs + used ones in txns)
async function getAllKnownExpenseCategories() {
    var cats = {};

    // 1 — defaults
    DEFAULT_EXPENSE_CATS.forEach(function (c) {
        cats[c.label] = c.emoji;
    });

    // 2 — custom expense categories (always localStorage)
    var customs = JSON.parse(localStorage.getItem("finantra_custom_expense")) || [];
    customs.forEach(function (c) {
        cats[c.label] = c.emoji;
    });

    // 3 — any expense category found in transactions not already listed
    try {
        var txns = await DataService.getTransactions();
        txns.forEach(function (t) {
            if (t.type === "Expense" && !cats[t.category]) {
                cats[t.category] = t.emoji || "📦";
            }
        });
    } catch (err) {
        console.error("getAllKnownExpenseCategories error:", err);
    }

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

var bpUnbudgetedCard  = document.getElementById("bpUnbudgetedCard");
var bpUnbudgetedList  = document.getElementById("bpUnbudgetedList");
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

async function renderSummaryCards(data, spendingMap) {
    var income    = await getMonthIncome(viewYear, viewMonth);
    var spent     = Object.values(spendingMap).reduce(function (a, b) { return a + b; }, 0);
    var budgeted  = data.categories.reduce(function (s, c) { return s + (c.limit || 0); }, 0);
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

bpCapSaveBtn.addEventListener("click", async function () {
    var val = parseFloat(bpCapInput.value);
    if (isNaN(val) || val < 0) {
        bpCapInput.style.borderColor = "#dc3545";
        setTimeout(function () { bpCapInput.style.borderColor = ""; }, 1500);
        return;
    }
    try {
        var data = await loadBudgetData(viewYear, viewMonth);
        data.cap = val;
        await saveBudgetData(viewYear, viewMonth, data);
        renderPage();
    } catch (err) {
        console.error("Cap save error:", err);
    }
});

bpCapInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") bpCapSaveBtn.click();
});


// ================================
// DAILY GUIDANCE
// ================================

async function renderDailyGuidance(data, spendingMap) {
    var now = new Date();

    if (!isCurrentMonth) {
        bpDailyAmount.textContent = "N/A";
        bpDaysLeft.textContent    = "—";
        bpSpentToday.textContent  = "—";
        bpAvgDaily.textContent    = "—";
        return;
    }

    var lastDay    = new Date(viewYear, viewMonth + 1, 0).getDate();
    var daysLeft   = lastDay - now.getDate() + 1;
    var daysElapsed = now.getDate();

    var spent = Object.values(spendingMap).reduce(function (a, b) { return a + b; }, 0);

    // Spent today
    var todayStr   = now.toISOString().split("T")[0];
    var todaySpent = 0;
    try {
        var txns = await DataService.getTransactions();
        txns.forEach(function (t) {
            if (t.type === "Expense" && t.date === todayStr) {
                todaySpent += parseFloat(t.amount);
            }
        });
    } catch (err) {
        console.error("renderDailyGuidance txn error:", err);
    }

    var cap       = data.cap || 0;
    var remaining = cap > 0 ? Math.max(cap - spent, 0) : 0;
    var daily     = cap > 0 ? Math.round(remaining / daysLeft) : 0;
    var avg       = daysElapsed > 0 ? Math.round(spent / daysElapsed) : 0;

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

async function saveInlineLimit(idx) {
    var inp = document.getElementById("bpInlineInput_" + idx);
    var val = parseFloat(inp.value);
    if (isNaN(val) || val < 0) {
        inp.style.borderColor = "#dc3545";
        setTimeout(function () { inp.style.borderColor = ""; }, 1200);
        return;
    }
    try {
        var data = await loadBudgetData(viewYear, viewMonth);
        data.categories[idx].limit = val;
        await saveBudgetData(viewYear, viewMonth, data);
        renderPage();
    } catch (err) {
        console.error("saveInlineLimit error:", err);
    }
}

async function removeCatRow(idx) {
    try {
        var data = await loadBudgetData(viewYear, viewMonth);
        var cat  = data.categories[idx];
        openModal({
            icon:         "🗑️",
            title:        "Remove Category?",
            message:      'Remove <strong>' + cat.emoji + ' ' + cat.label + '</strong> from this month\'s budget?<br><br>Your transactions won\'t be affected.',
            confirmText:  "Remove",
            confirmClass: "",
            onConfirm: async function () {
                try {
                    // Re-fetch to avoid stale state if modal delayed
                    var freshData = await loadBudgetData(viewYear, viewMonth);
                    freshData.categories.splice(idx, 1);
                    await saveBudgetData(viewYear, viewMonth, freshData);
                    renderPage();
                } catch (err) {
                    console.error("removeCatRow save error:", err);
                }
            }
        });
    } catch (err) {
        console.error("removeCatRow load error:", err);
    }
}


// ================================
// ADD CATEGORY PANEL
// ================================

async function populateCatSelect(data) {
    var allCats = await getAllKnownExpenseCategories();
    var added   = data.categories.map(function (c) { return c.label; });

    bpCatSelect.innerHTML = '<option value="">— Select a category —</option>';

    Object.keys(allCats).forEach(function (label) {
        if (added.indexOf(label) !== -1) return;
        var opt = document.createElement("option");
        opt.value       = label;
        opt.textContent = allCats[label] + "  " + label;
        bpCatSelect.appendChild(opt);
    });
}

bpAddCatBtn.addEventListener("click", async function () {
    try {
        var data = await loadBudgetData(viewYear, viewMonth);
        await populateCatSelect(data);
        bpAddCatPanel.classList.toggle("visible");
        bpAddCatError.classList.remove("visible");
        bpCatLimitInput.value = "";
        bpCatSelect.value = "";
        if (bpAddCatPanel.classList.contains("visible")) {
            bpCatSelect.focus();
        }
    } catch (err) {
        console.error("bpAddCatBtn error:", err);
    }
});

bpAddCatCancel.addEventListener("click", function () {
    bpAddCatPanel.classList.remove("visible");
});

bpAddCatConfirm.addEventListener("click", async function () {
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

    try {
        var allCats = await getAllKnownExpenseCategories();
        var emoji   = allCats[label] || "📦";

        var data = await loadBudgetData(viewYear, viewMonth);
        data.categories.push({ label: label, emoji: emoji, limit: limit });
        await saveBudgetData(viewYear, viewMonth, data);

        bpAddCatPanel.classList.remove("visible");
        renderPage();
    } catch (err) {
        console.error("bpAddCatConfirm error:", err);
    }
});

bpCatLimitInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") bpAddCatConfirm.click();
});


// ================================
// UNBUDGETED CATEGORIES
// ================================

async function renderUnbudgeted(data, spendingMap) {
    var budgetedLabels = data.categories.map(function (c) { return c.label; });
    var unbudgeted     = [];

    try {
        var allCats = await getAllKnownExpenseCategories();
        Object.keys(spendingMap).forEach(function (label) {
            if (budgetedLabels.indexOf(label) === -1 && spendingMap[label] > 0) {
                unbudgeted.push({
                    label: label,
                    emoji: allCats[label] || "📦",
                    spent: spendingMap[label]
                });
            }
        });
    } catch (err) {
        console.error("renderUnbudgeted error:", err);
    }

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

async function quickAddFromUnbudgeted(label) {
    try {
        var data = await loadBudgetData(viewYear, viewMonth);
        await populateCatSelect(data);
        bpAddCatPanel.classList.add("visible");
        bpCatSelect.value = label;
        bpCatLimitInput.focus();
        bpAddCatPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
        console.error("quickAddFromUnbudgeted error:", err);
    }
}


// ================================
// BULK EDIT MODAL
// ================================

bpBulkEditBtn.addEventListener("click", async function () {
    try {
        var data = await loadBudgetData(viewYear, viewMonth);
        if (data.categories.length === 0) {
            openModal({
                icon:         "ℹ️",
                title:        "No Categories Yet",
                message:      "Add some category budgets first, then use Bulk Edit to update them all at once.",
                confirmText:  "Got it",
                confirmClass: "primary",
                onConfirm:    function () {}
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
    } catch (err) {
        console.error("bpBulkEditBtn error:", err);
    }
});

function closeBulkModal() {
    bpBulkOverlay.classList.remove("active");
}

bpBulkClose.addEventListener("click",  closeBulkModal);
bpBulkCancel.addEventListener("click", closeBulkModal);

bpBulkOverlay.addEventListener("click", function (e) {
    if (e.target === bpBulkOverlay) closeBulkModal();
});

bpBulkSave.addEventListener("click", async function () {
    try {
        var data = await loadBudgetData(viewYear, viewMonth);
        data.categories.forEach(function (cat, idx) {
            var inp = document.getElementById("bpBulkIn_" + idx);
            if (inp) {
                var val = parseFloat(inp.value);
                cat.limit = isNaN(val) || val < 0 ? 0 : val;
            }
        });
        await saveBudgetData(viewYear, viewMonth, data);
        closeBulkModal();
        renderPage();
    } catch (err) {
        console.error("bpBulkSave error:", err);
    }
});


// ================================
// MONTHLY RESET DIALOG
// Shows when current month has no
// budget data but previous month does
// ================================

async function checkNewMonth() {
    if (!isCurrentMonth) return;

    // Check if current month already has categories saved
    try {
        var curData = await DataService.getBudget(viewYear, viewMonth + 1);
        if (curData && curData.categories && curData.categories.length > 0) return;
    } catch (err) {
        // If fetch fails, check legacy localStorage key
        var legacyKey = getBudgetKey(viewYear, viewMonth);
        if (localStorage.getItem(legacyKey)) return;
    }

    // Check previous month
    var prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    var prevM = viewMonth === 0 ? 11 : viewMonth - 1;

    var prevData = null;
    try {
        prevData = await DataService.getBudget(prevY, prevM + 1);
    } catch (err) {
        // Fall back to legacy localStorage key
        var legacyPrev = localStorage.getItem(getBudgetKey(prevY, prevM));
        if (legacyPrev) {
            try { prevData = JSON.parse(legacyPrev); } catch (_) {}
        }
    }

    if (!prevData || !prevData.categories || prevData.categories.length === 0) return;

    // Show reset dialog
    bpResetMsg.textContent = "It's " + MONTH_NAMES[viewMonth] + "! What would you like to do with your budgets?";
    bpResetSub.textContent = MONTH_NAMES[prevM] + "'s budgets have been saved in history.";
    bpResetOverlay.classList.add("active");
}

bpResetKeep.addEventListener("click", async function () {
    var prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    var prevM = viewMonth === 0 ? 11 : viewMonth - 1;

    try {
        var prevData = await loadBudgetData(prevY, prevM);
        var newData  = {
            cap:        prevData.cap || 0,
            categories: prevData.categories.map(function (c) {
                return { label: c.label, emoji: c.emoji, limit: c.limit };
            })
        };
        await saveBudgetData(viewYear, viewMonth, newData);
        bpResetOverlay.classList.remove("active");
        renderPage();
    } catch (err) {
        console.error("bpResetKeep error:", err);
    }
});

bpResetFresh.addEventListener("click", async function () {
    try {
        await saveBudgetData(viewYear, viewMonth, { cap: 0, categories: [] });
        bpResetOverlay.classList.remove("active");
        renderPage();
    } catch (err) {
        console.error("bpResetFresh error:", err);
    }
});


// ================================
// MAIN RENDER
// ================================

async function renderPage() {
    renderMonthLabel();

    try {
        var data        = await loadBudgetData(viewYear, viewMonth);
        var spendingMap = await buildSpendingMap(viewYear, viewMonth);

        await renderSummaryCards(data, spendingMap);
        renderCapSection(data, spendingMap);
        await renderDailyGuidance(data, spendingMap);
        renderCategoryRows(data, spendingMap);
        await renderUnbudgeted(data, spendingMap);
    } catch (err) {
        console.error("renderPage error:", err);
    }
}


// ================================
// INIT
// ================================

(async function init() {
    await renderPage();
    await checkNewMonth();
})();