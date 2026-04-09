// ================================
// SIDEBAR TOGGLE — DESKTOP
// ================================

const sidebar       = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const overlay       = document.getElementById("sidebarOverlay");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const navLinks      = document.querySelectorAll(".sidebar a");

// Tooltip titles for collapsed sidebar
navLinks.forEach(function (link) {
    const text = link.querySelector(".link-text");
    if (text) link.setAttribute("title", text.textContent.trim());
});

// Desktop collapse / expand
sidebarToggle.addEventListener("click", function () {
    sidebar.classList.toggle("collapsed");
    const icon = sidebarToggle.querySelector("i");
    if (sidebar.classList.contains("collapsed")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-angles-right");
    } else {
        icon.classList.remove("fa-angles-right");
        icon.classList.add("fa-bars");
    }
});


// ================================
// MOBILE SIDEBAR DRAWER
// ================================

function isMobile() {
    return window.innerWidth <= 768;
}

mobileMenuBtn.addEventListener("click", function () {
    sidebar.classList.toggle("mobile-open");
    overlay.classList.toggle("active");
});

overlay.addEventListener("click", function () {
    sidebar.classList.remove("mobile-open");
    overlay.classList.remove("active");
});

navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        if (isMobile()) {
            sidebar.classList.remove("mobile-open");
            overlay.classList.remove("active");
        }
    });
});

window.addEventListener("resize", function () {
    if (!isMobile()) {
        sidebar.classList.remove("mobile-open");
        overlay.classList.remove("active");
    }
});


// ================================
// ACTIVE SIDEBAR LINK
// ================================

const currentPage = window.location.pathname.split("/").pop();
navLinks.forEach(function (link) {
    const href = link.getAttribute("href");
    if (href && href === currentPage) {
        navLinks.forEach(function (l) { l.classList.remove("active"); });
        link.classList.add("active");
    }
});

navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        navLinks.forEach(function (l) { l.classList.remove("active"); });
        this.classList.add("active");
    });
});


// ================================
// CHART COLORS
// ================================

const pieColors    = ["#1f82a6","#28a745","#ffc107","#dc3545","#6f42c1","#fd7e14","#20c997","#e83e8c"];
const incomeColor  = "#28a745";
const expenseColor = "#dc3545";

let pieChartInstance = null;
let barChartInstance = null;


// ================================
// DATE HELPERS
// ================================

function getTodayStr() {
    return new Date().toISOString().split("T")[0];
}

function getWeekStart() {
    const now  = new Date();
    const day  = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.getFullYear(), now.getMonth(), diff)
        .toISOString().split("T")[0];
}

function getMonthStart() {
    const now = new Date();
    return now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-01";
}

function getYearStart() {
    return new Date().getFullYear() + "-01-01";
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return "—";
    const [year, month, day] = dateStr.split("-");
    const months = ["Jan","Feb","Mar","Apr","May",
                    "Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return parseInt(day) + " " + months[parseInt(month) - 1];
}

function getMonthName() {
    return new Date().toLocaleString("default", { month: "long" });
}

function getYearStr() {
    return String(new Date().getFullYear());
}


// ================================
// FILTER TRANSACTIONS BY MODE
// ================================

function filterByMode(transactions, mode) {
    const today = getTodayStr();

    if (mode === "weekly") {
        const weekStart = getWeekStart();
        return transactions.filter(function (t) {
            return t.date >= weekStart && t.date <= today;
        });
    }

    if (mode === "monthly") {
        const monthStart = getMonthStart();
        return transactions.filter(function (t) {
            return t.date >= monthStart && t.date <= today;
        });
    }

    if (mode === "yearly") {
        const yearStart = getYearStart();
        return transactions.filter(function (t) {
            return t.date >= yearStart && t.date <= today;
        });
    }

    return transactions;
}


// ================================
// CALCULATE SUMMARY
// ================================

function calcSummary(transactions) {
    let income  = 0;
    let expense = 0;

    transactions.forEach(function (t) {
        if (t.type === "Income") income  += parseFloat(t.amount);
        else                     expense += parseFloat(t.amount);
    });

    const savings = income - expense;
    const rate    = income > 0 ? Math.round((savings / income) * 100) : 0;

    return { income, expense, savings, rate };
}


// ================================
// UPDATE SUMMARY CARDS
// ================================

function updateCards(summary) {
    const incomeEl  = document.getElementById("cardIncome");
    const expenseEl = document.getElementById("cardExpense");
    const savingsEl = document.getElementById("cardSavings");
    const rateEl    = document.getElementById("cardRate");

    if (!incomeEl) return;

    incomeEl.textContent  = "₹ " + summary.income.toLocaleString("en-IN");
    expenseEl.textContent = "₹ " + summary.expense.toLocaleString("en-IN");

    savingsEl.textContent = (summary.savings >= 0 ? "₹ " : "-₹ ") +
        Math.abs(summary.savings).toLocaleString("en-IN");
    savingsEl.style.color = summary.savings >= 0 ? "#28a745" : "#dc3545";

    rateEl.textContent = summary.rate + "%";
    rateEl.style.color = summary.rate >= 50 ? "#28a745"
                       : summary.rate >= 20 ? "#f0a500" : "#dc3545";
}


// ================================
// BUILD PIE CHART DATA
// ================================

function buildPieData(transactions) {
    const expenses = transactions.filter(function (t) { return t.type === "Expense"; });
    const catMap   = {};

    expenses.forEach(function (t) {
        catMap[t.category] = (catMap[t.category] || 0) + parseFloat(t.amount);
    });

    return {
        labels: Object.keys(catMap),
        data:   Object.values(catMap)
    };
}


// ================================
// BUILD BAR CHART DATA
// ================================

function buildBarData(transactions, mode) {

    if (mode === "weekly") {
        const dayLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
        const dayOrder  = [1,2,3,4,5,6,0];
        const dayTotals = [0,0,0,0,0,0,0];
        const today     = new Date().getDay();

        transactions.filter(function (t) {
            return t.type === "Expense";
        }).forEach(function (t) {
            const d = new Date(t.date).getDay();
            const i = dayOrder.indexOf(d);
            if (i !== -1) dayTotals[i] += parseFloat(t.amount);
        });

        const barColors = dayOrder.map(function (d) {
            const dayIndex   = dayOrder.indexOf(d);
            const todayIndex = dayOrder.indexOf(today);
            return dayIndex > todayIndex ? "#dee2e6" : expenseColor;
        });

        return { type: "daily", labels: dayLabels, data: dayTotals, colors: barColors, income: null };
    }

    if (mode === "monthly") {
        const weekLabels = ["Week 1","Week 2","Week 3","Week 4"];
        const weekTotals = [0,0,0,0];

        transactions.filter(function (t) {
            return t.type === "Expense";
        }).forEach(function (t) {
            const day     = parseInt(t.date.split("-")[2]);
            const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
            weekTotals[weekIdx] += parseFloat(t.amount);
        });

        return { type: "expense-only", labels: weekLabels, data: weekTotals, colors: null, income: null };
    }

    if (mode === "yearly") {
        const monthNames   = ["Jan","Feb","Mar","Apr","May","Jun",
                              "Jul","Aug","Sep","Oct","Nov","Dec"];
        const currentMonth = new Date().getMonth();
        const labels       = monthNames.slice(0, currentMonth + 1);
        const incomeData   = new Array(currentMonth + 1).fill(0);
        const expenseData  = new Array(currentMonth + 1).fill(0);

        transactions.forEach(function (t) {
            const m = parseInt(t.date.split("-")[1]) - 1;
            if (m <= currentMonth) {
                if (t.type === "Income") incomeData[m]  += parseFloat(t.amount);
                else                     expenseData[m] += parseFloat(t.amount);
            }
        });

        return { type: "income-expense", labels, data: expenseData, colors: null, income: incomeData };
    }

    return { type: "expense-only", labels: [], data: [], colors: null, income: null };
}


// ================================
// RENDER PIE CHART
// ================================

function renderPieChart(pieData) {
    const ctx = document.getElementById("pieChart").getContext("2d");

    if (pieChartInstance) pieChartInstance.destroy();

    if (pieData.data.length === 0) {
        pieChartInstance = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["No expenses yet"],
                datasets: [{ data: [1], backgroundColor: ["#eee"], borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
        return;
    }

    pieChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: pieData.labels,
            datasets: [{
                data:            pieData.data,
                backgroundColor: pieColors.slice(0, pieData.labels.length),
                borderWidth:     2,
                borderColor:     "#fff",
                hoverOffset:     8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { animateScale: true, duration: 600 },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { padding: 16, font: { size: 12 }, usePointStyle: true }
                },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            const total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                            const pct   = ((ctx.parsed / total) * 100).toFixed(1);
                            return " ₹" + ctx.parsed.toLocaleString("en-IN") + " (" + pct + "%)";
                        }
                    }
                }
            }
        }
    });
}


// ================================
// RENDER BAR CHART
// ================================

function renderBarChart(barData) {
    const ctx = document.getElementById("barChart").getContext("2d");

    if (barChartInstance) barChartInstance.destroy();

    let chartConfig;

    if (barData.type === "income-expense") {
        chartConfig = {
            type: "bar",
            data: {
                labels: barData.labels,
                datasets: [
                    {
                        label:           "Income",
                        data:            barData.income,
                        backgroundColor: incomeColor,
                        borderRadius:    6,
                        barPercentage:   0.4
                    },
                    {
                        label:           "Expenses",
                        data:            barData.data,
                        backgroundColor: expenseColor,
                        borderRadius:    6,
                        barPercentage:   0.4
                    }
                ]
            }
        };

    } else if (barData.type === "daily") {
        chartConfig = {
            type: "bar",
            data: {
                labels: barData.labels,
                datasets: [{
                    label:           "Expenses",
                    data:            barData.data,
                    backgroundColor: barData.colors,
                    borderRadius:    6,
                    barPercentage:   0.6
                }]
            }
        };

    } else {
        chartConfig = {
            type: "bar",
            data: {
                labels: barData.labels,
                datasets: [{
                    label:           "Expenses",
                    data:            barData.data,
                    backgroundColor: expenseColor,
                    borderRadius:    6,
                    barPercentage:   0.5
                }]
            }
        };
    }

    chartConfig.options = {
        responsive:          true,
        maintainAspectRatio: false,
        animation:           { duration: 600 },
        plugins: {
            legend: {
                display:  barData.type === "income-expense",
                position: "bottom",
                labels:   { padding: 16, font: { size: 12 }, usePointStyle: true }
            },
            tooltip: {
                callbacks: {
                    label: function (ctx) {
                        return " ₹" + ctx.parsed.y.toLocaleString("en-IN");
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: "#f0f0f0" },
                ticks: {
                    callback: function (v) {
                        return v >= 1000 ? "₹" + (v / 1000).toFixed(0) + "k" : "₹" + v;
                    },
                    font: { size: 11 }
                }
            },
            x: {
                grid:  { display: false },
                ticks: { font: { size: 11 } }
            }
        }
    };

    barChartInstance = new Chart(ctx, chartConfig);
}


// ================================
// UPDATE CHART TITLES
// ================================

// function updateTitles(mode) {
//     const month = getMonthName();
//     const year  = getYearStr();

//     const titles = {
//         monthly: { pie: "Expense Breakdown — " + month,     bar: "Week-wise Expenses — " + month },
//         weekly:  { pie: "Expense Breakdown — This Week",    bar: "Day-wise Expenses — This Week" },
//         yearly:  { pie: "Expense Breakdown — " + year,      bar: "Monthly Income vs Expense — " + year }
//     };

//     document.getElementById("pieChartTitle").textContent = titles[mode].pie;
//     document.getElementById("barChartTitle").textContent = titles[mode].bar;
// }
// ================================
// UPDATE CHART TITLES
// ================================

function updateTitles(mode) {
    const month = getMonthName();
    const year  = getYearStr();

    const titles = {
        monthly: { pie: "Expense Breakdown — " + month,     bar: "Week-wise Expenses — " + month },
        weekly:  { pie: "Expense Breakdown — This Week",    bar: "Day-wise Expenses — This Week" },
        yearly:  { pie: "Expense Breakdown — " + year,      bar: "Monthly Income vs Expense — " + year },
        all:     { pie: "Expense Breakdown — All Time",     bar: "Income vs Expense — All Time" }
    };

    // Safety fallback just in case mode is unrecognized
    const safeMode = titles[mode] ? mode : "monthly";

    document.getElementById("pieChartTitle").textContent = titles[safeMode].pie;
    document.getElementById("barChartTitle").textContent = titles[safeMode].bar;
}


// ================================
// RENDER RECENT TRANSACTIONS (last 5)
// ================================

function renderRecentTransactions(transactions) {
    const tbody      = document.getElementById("recentTbody");
    const table      = document.getElementById("recentTable");
    const emptyState = document.getElementById("noTransactions");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (transactions.length === 0) {
        table.style.display      = "none";
        emptyState.style.display = "block";
        return;
    }

    table.style.display      = "";
    emptyState.style.display = "none";

    // Sort newest first, take last 5
    // Use String comparison for id — safe for both ObjectId and Date.now()
    const recent = [...transactions]
        .sort(function (a, b) {
            return b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id));
        })
        .slice(0, 5);

    recent.forEach(function (t) {
        const isIncome = t.type === "Income";
        const sign     = isIncome ? "+ ₹" : "- ₹";
        const amtClass = isIncome ? "income" : "expense";
        const dateStr  = formatDisplayDate(t.date);
        const notes    = t.notes || t.payment || "—";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${dateStr}</td>
            <td>${t.emoji || ""} ${t.category}</td>
            <td>${notes}</td>
            <td class="${amtClass}">${sign}${parseFloat(t.amount).toLocaleString("en-IN")}</td>
        `;
        tbody.appendChild(tr);
    });
}


// ================================
// FILTER BUTTONS  ← SWAPPED
// ================================

function setFilter(btn, mode) {
    document.querySelectorAll(".filter").forEach(function (f) {
        f.classList.remove("active");
    });
    btn.classList.add("active");

    renderDashboard(mode);   // async — fire and forget is fine here
}


// ================================
// RENDER DASHBOARD  ← SWAPPED
// ================================

async function renderDashboard(mode) {
    const isDashboard = document.getElementById("cardIncome") !== null;
    if (!isDashboard) return;

    let all = [];
    try {
        all = await DataService.getTransactions();
    } catch (err) {
        console.error("renderDashboard: failed to load transactions:", err.message);
    }

    const filtered = filterByMode(all, mode);
    const summary  = calcSummary(filtered);
    const pieData  = buildPieData(filtered);
    const barData  = buildBarData(filtered, mode);

    updateCards(summary);
    updateTitles(mode);
    renderPieChart(pieData);
    renderBarChart(barData);

    // Recent transactions — always all-time last 5
    renderRecentTransactions(all);
}


// ================================
// APPLY SAVED THEME ON EVERY PAGE
// ================================

(function applySavedTheme() {
    const prefs = JSON.parse(localStorage.getItem("finantra_preferences")) || {};
    if (prefs.theme === "dark") {
        document.body.classList.add("dark-mode");
    }
})();


// ================================
// SHARED MODAL SYSTEM
// Assignment 6 — Modal popup
// ================================

let modalConfirmCallback = null;

function openModal(options) {
    const modal   = document.getElementById("sharedModal");
    const overlay = document.getElementById("modalOverlay");

    if (!modal || !overlay) return;

    document.getElementById("modalIcon").textContent       = options.icon        || "⚠️";
    document.getElementById("modalTitle").textContent      = options.title       || "Are you sure?";
    document.getElementById("modalMessage").innerHTML      = options.message     || "";
    document.getElementById("modalConfirmBtn").textContent = options.confirmText || "Confirm";

    const confirmBtn  = document.getElementById("modalConfirmBtn");
    confirmBtn.className = "modal-confirm-btn";
    if (options.confirmClass) confirmBtn.classList.add(options.confirmClass);

    modalConfirmCallback = options.onConfirm || null;

    overlay.classList.add("active");
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    const modal   = document.getElementById("sharedModal");
    const overlay = document.getElementById("modalOverlay");

    if (!modal || !overlay) return;

    modal.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
    modalConfirmCallback = null;
}

function confirmModal() {
    if (modalConfirmCallback) modalConfirmCallback();
    closeModal();
}

document.addEventListener("click", function (e) {
    const overlay = document.getElementById("modalOverlay");
    if (e.target === overlay) closeModal();
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
});


// ================================
// INIT  ← SWAPPED
// ================================

(async function init() {
    const isDashboard = document.getElementById("cardIncome") !== null;
    if (!isDashboard) return;

    const prefs         = JSON.parse(localStorage.getItem("finantra_preferences")) || {};
    const defaultFilter = prefs.defaultFilter || "monthly";

    document.querySelectorAll(".filter").forEach(function (btn) {
        btn.classList.remove("active");
        if (btn.textContent.trim().toLowerCase() === defaultFilter) {
            btn.classList.add("active");
        }
    });

    await renderDashboard(defaultFilter);
})();