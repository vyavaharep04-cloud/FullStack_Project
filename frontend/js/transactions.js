// ================================
// TRANSACTIONS PAGE
// Reads from localStorage: finantra_transactions
// Features: search, filter, sort, date group, delete, load more
// ================================


// ================================
// STATE
// ================================

const PAGE_SIZE    = 20;
let visibleCount   = PAGE_SIZE;
let filteredData   = [];


// ================================
// ELEMENT REFERENCES
// ================================

const txnList          = document.getElementById("txnList");
const emptyState       = document.getElementById("emptyState");
const emptyStateMsg    = document.getElementById("emptyStateMsg");
const loadMoreWrap     = document.getElementById("loadMoreWrap");
const deleteConfirmBar = document.getElementById("deleteConfirmBar");
const deleteConfirmText = document.getElementById("deleteConfirmText");

const searchInput  = document.getElementById("searchInput");
const typeFilter   = document.getElementById("typeFilter");
const dateFilter   = document.getElementById("dateFilter");
const sortSelect   = document.getElementById("sortSelect");

const summaryIncome  = document.getElementById("summaryIncome");
const summaryExpense = document.getElementById("summaryExpense");
const summaryNet     = document.getElementById("summaryNet");
const summaryCount   = document.getElementById("summaryCount");


// ================================
// LOAD TRANSACTIONS FROM LOCALSTORAGE
// ================================

function getTransactions() {
    return JSON.parse(localStorage.getItem("finantra_transactions")) || [];
}

function saveTransactions(data) {
    localStorage.setItem("finantra_transactions", JSON.stringify(data));
}


// ================================
// DATE HELPERS
// ================================

function getToday() {
    return new Date().toISOString().split("T")[0];
}

function getWeekStart() {
    const now  = new Date();
    const day  = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split("T")[0];
}

function getMonthStart() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return "Unknown";
    const [year, month, day] = dateStr.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"];
    const today    = getToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];

    if (dateStr === today)  return "Today";
    if (dateStr === yStr)   return "Yesterday";
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}


// ================================
// APPLY FILTERS + SORT
// ================================

function applyFilters() {
    visibleCount = PAGE_SIZE;
    const all = getTransactions();

    const search   = searchInput.value.toLowerCase().trim();
    const type     = typeFilter.value;
    const dateMode = dateFilter.value;
    const sort     = sortSelect.value;

    // Date boundaries
    const today      = getToday();
    const weekStart  = getWeekStart();
    const monthStart = getMonthStart();

    // Filter
    filteredData = all.filter(function (t) {

        // Search match
        const searchMatch = search === "" ||
            t.category.toLowerCase().includes(search) ||
            (t.notes && t.notes.toLowerCase().includes(search));

        // Type match
        const typeMatch = type === "all" || t.type === type;

        // Date match
        let dateMatch = true;
        if (dateMode === "today")  dateMatch = t.date === today;
        if (dateMode === "week")   dateMatch = t.date >= weekStart;
        if (dateMode === "month")  dateMatch = t.date >= monthStart;

        return searchMatch && typeMatch && dateMatch;
    });

    // Sort
    filteredData.sort(function (a, b) {
        if (sort === "newest")      return b.date.localeCompare(a.date) || b.id - a.id;
        if (sort === "oldest")      return a.date.localeCompare(b.date) || a.id - b.id;
        if (sort === "amount-high") return b.amount - a.amount;
        if (sort === "amount-low")  return a.amount - b.amount;
        return 0;
    });

    // Update summary cards
    updateSummary(filteredData);

    // Render
    renderList();
}


// ================================
// UPDATE SUMMARY CARDS
// ================================

function updateSummary(data) {
    let income  = 0;
    let expense = 0;

    data.forEach(function (t) {
        if (t.type === "Income") income  += t.amount;
        else                     expense += t.amount;
    });

    const net = income - expense;

    summaryIncome.textContent  = "₹ " + income.toLocaleString("en-IN");
    summaryExpense.textContent = "₹ " + expense.toLocaleString("en-IN");
    summaryNet.textContent     = (net >= 0 ? "₹ " : "-₹ ") + Math.abs(net).toLocaleString("en-IN");
    summaryNet.style.color     = net >= 0 ? "#28a745" : "#dc3545";
    summaryCount.textContent   = data.length;
}


// ================================
// RENDER TRANSACTION LIST
// ================================

function renderList() {
    txnList.innerHTML = "";

    const slice = filteredData.slice(0, visibleCount);

    // Empty state
    if (filteredData.length === 0) {
        emptyState.classList.add("visible");
        loadMoreWrap.classList.remove("visible");

        const hasAny = getTransactions().length > 0;
        emptyStateMsg.textContent = hasAny
            ? "No transactions match your current filters."
            : "You have no transactions yet. Add your first one!";
        return;
    }

    emptyState.classList.remove("visible");

    // Group by date
    const groups = {};
    slice.forEach(function (t) {
        const key = t.date || "unknown";
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
    });

    // Sort group keys
    const sortedDates = Object.keys(groups).sort(function (a, b) {
        const s = sortSelect.value;
        if (s === "oldest") return a.localeCompare(b);
        return b.localeCompare(a);
    });

    // Render each date group
    sortedDates.forEach(function (date) {
        const items = groups[date];

        // Calculate group net
        let groupNet = 0;
        items.forEach(function (t) {
            groupNet += t.type === "Income" ? t.amount : -t.amount;
        });

        const groupEl = document.createElement("div");
        groupEl.classList.add("date-group");

        // Date header
        const header = document.createElement("div");
        header.classList.add("date-group-header");
        header.innerHTML = `
            <span class="date-group-label">${formatDisplayDate(date)}</span>
            <div class="date-group-line"></div>
            <span class="date-group-total" style="color:${groupNet >= 0 ? '#28a745' : '#dc3545'}">
                ${groupNet >= 0 ? "+" : ""}₹${Math.abs(groupNet).toLocaleString("en-IN")}
            </span>
        `;
        groupEl.appendChild(header);

        // Transaction items
        items.forEach(function (t) {
            groupEl.appendChild(createTxnItem(t));
        });

        txnList.appendChild(groupEl);
    });

    // Load more button
    if (filteredData.length > visibleCount) {
        loadMoreWrap.classList.add("visible");
    } else {
        loadMoreWrap.classList.remove("visible");
    }
}


// ================================
// CREATE SINGLE TRANSACTION ITEM
// ================================

function createTxnItem(t) {
    const isIncome = t.type === "Income";
    const sign     = isIncome ? "+ ₹" : "- ₹";
    const amtClass = isIncome ? "income" : "expense";
    const emojiClass = isIncome ? "income-emoji" : "expense-emoji";
    const emoji    = t.emoji || "💰";

    const div = document.createElement("div");
    div.classList.add("txn-item");
    div.setAttribute("data-id", t.id);

    div.innerHTML = `
        <div class="txn-emoji ${emojiClass}">${emoji}</div>
        <div class="txn-info">
            <div class="txn-category">${t.category}</div>
            <div class="txn-notes">${t.notes || t.payment || "—"}</div>
        </div>
        <span class="txn-payment">${t.payment}</span>
        <div class="txn-right">
            <span class="txn-amount ${amtClass}">
                ${sign}${parseFloat(t.amount).toLocaleString("en-IN")}
            </span>
            <span class="txn-type-badge ${amtClass}">${t.type}</span>
        </div>
        <button class="txn-delete" onclick="deleteTransaction(${t.id})" title="Delete">
            <i class="fa-solid fa-trash-can"></i>
        </button>
    `;

    return div;
}


// ================================
// LOAD MORE
// ================================

function loadMore() {
    visibleCount += PAGE_SIZE;
    renderList();
}


// ================================
// DELETE TRANSACTION
// ================================

// function deleteTransaction(id) {
//     const confirmed = confirm("Delete this transaction? This cannot be undone.");
//     if (!confirmed) return;

//     let transactions = getTransactions();
//     const deleted    = transactions.find(function (t) { return t.id === id; });
//     transactions     = transactions.filter(function (t) { return t.id !== id; });
//     saveTransactions(transactions);

//     // Show snackbar
//     if (deleted) {
//         deleteConfirmText.textContent =
//             `"${deleted.category}" transaction deleted`;
//         showSnackbar();
//     }

//     // Re-apply filters
//     applyFilters();
// }
function deleteTransaction(id) {
    const transactions = getTransactions();
    const t = transactions.find(function (t) { return t.id === id; });
    if (!t) return;

    const sign   = t.type === "Income" ? "+ ₹" : "- ₹";
    const amount = parseFloat(t.amount).toLocaleString("en-IN");

    openModal({
        icon:         "🗑️",
        title:        "Delete Transaction?",
        message:      `<strong>${t.emoji || ""} ${t.category}</strong> — ${sign}${amount}<br><br>This action cannot be undone.`,
        confirmText:  "Delete",
        confirmClass: "",
        onConfirm: function () {
            let data = getTransactions();
            data = data.filter(function (item) { return item.id !== id; });
            saveTransactions(data);
            deleteConfirmText.textContent = `"${t.category}" deleted`;
            showSnackbar();
            applyFilters();
        }
    });
}


// ================================
// SNACKBAR
// ================================

let snackTimer = null;

function showSnackbar() {
    deleteConfirmBar.classList.add("visible");
    if (snackTimer) clearTimeout(snackTimer);
    snackTimer = setTimeout(function () {
        deleteConfirmBar.classList.remove("visible");
    }, 3000);
}


// ================================
// INIT
// ================================

(function init() {
    applyFilters();
})();