// ================================
// ANALYTICS PAGE
// Reads from localStorage: finantra_transactions
// Charts: Expense Breakdown, Payment Split,
//         Income vs Expense Trend, Daily Pattern,
//         Savings Rate, Top Categories
// ================================


// ================================
// CHART COLOR PALETTE
// ================================

const CATEGORY_COLORS = [
    "#1f82a6", "#28a745", "#dc3545", "#f0a500",
    "#6f42c1", "#fd7e14", "#20c997", "#e83e8c"
];

const INCOME_COLOR  = "#28a745";
const EXPENSE_COLOR = "#dc3545";
const SAVINGS_COLOR = "#1f82a6";


// ================================
// CHART INSTANCES (to destroy on re-render)
// ================================

let chartExpense  = null;
let chartPayment  = null;
let chartTrend    = null;
let chartDaily    = null;
let chartSavings  = null;


// ================================
// STATE
// ================================

let currentPeriod = "month";


// ================================
// GET TRANSACTIONS FROM LOCALSTORAGE
// ================================

function getTransactions() {
    return JSON.parse(localStorage.getItem("finantra_transactions")) || [];
}


// ================================
// DATE HELPERS
// ================================

function getToday() {
    return new Date().toISOString().split("T")[0];
}

function getPeriodStart(period) {
    const now = new Date();

    if (period === "7days") {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return d.toISOString().split("T")[0];
    }

    if (period === "month") {
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    }

    if (period === "3months") {
        const d = new Date();
        d.setMonth(d.getMonth() - 3);
        return d.toISOString().split("T")[0];
    }

    if (period === "year") {
        return `${now.getFullYear()}-01-01`;
    }

    return null; // all time
}

function filterByPeriod(transactions, period) {
    const start = getPeriodStart(period);
    if (!start) return transactions;
    return transactions.filter(function (t) { return t.date >= start; });
}

function formatShortDate(dateStr) {
    const [, month, day] = dateStr.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${parseInt(day)} ${months[parseInt(month)-1]}`;
}


// ================================
// PERIOD SELECTOR
// ================================

function setPeriod(period, btn) {
    currentPeriod = period;

    document.querySelectorAll(".period-pill").forEach(function (p) {
        p.classList.remove("active");
    });
    btn.classList.add("active");

    renderAll();
}


// ================================
// RENDER ALL
// ================================

function renderAll() {
    const all  = getTransactions();
    const data = filterByPeriod(all, currentPeriod);

    updateOverview(data);
    renderExpenseBreakdown(data);
    renderPaymentSplit(data);
    renderTrend(data);
    renderDailyPattern(data);
    renderSavingsRate(data);
    renderTopCategories(data);
}


// ================================
// OVERVIEW CARDS
// ================================

function updateOverview(data) {
    let income = 0;
    let expense = 0;

    data.forEach(function (t) {
        if (t.type === "Income") income  += t.amount;
        else                     expense += t.amount;
    });

    const savings = income - expense;
    const rate    = income > 0 ? Math.round((savings / income) * 100) : 0;

    // Avg daily spend — based on number of unique days
    const days = new Set(data.filter(t => t.type === "Expense").map(t => t.date)).size || 1;
    const avg  = expense > 0 ? Math.round(expense / days) : 0;

    document.getElementById("ovIncome").textContent  = "₹ " + income.toLocaleString("en-IN");
    document.getElementById("ovExpense").textContent = "₹ " + expense.toLocaleString("en-IN");

    const savingsEl = document.getElementById("ovSavings");
    savingsEl.textContent = (savings >= 0 ? "₹ " : "-₹ ") + Math.abs(savings).toLocaleString("en-IN");
    savingsEl.style.color = savings >= 0 ? "#28a745" : "#dc3545";

    const rateEl = document.getElementById("ovRate");
    rateEl.textContent = rate + "%";
    rateEl.style.color = rate >= 50 ? "#28a745" : rate >= 20 ? "#f0a500" : "#dc3545";

    document.getElementById("ovAvg").textContent = "₹ " + avg.toLocaleString("en-IN");
}


// ================================
// HELPER — Show/Hide chart empty state
// ================================

function showEmpty(emptyId, canvasId) {
    document.getElementById(emptyId).classList.add("visible");
    const canvas = document.getElementById(canvasId);
    if (canvas) canvas.style.display = "none";
}

function hideEmpty(emptyId, canvasId) {
    document.getElementById(emptyId).classList.remove("visible");
    const canvas = document.getElementById(canvasId);
    if (canvas) canvas.style.display = "block";
}

function destroyChart(instance) {
    if (instance) {
        instance.destroy();
        instance = null;
    }
    return null;
}


// ================================
// CHART 1 — EXPENSE BREAKDOWN (Doughnut)
// ================================

function renderExpenseBreakdown(data) {
    chartExpense = destroyChart(chartExpense);

    const expenses = data.filter(function (t) { return t.type === "Expense"; });

    if (expenses.length === 0) {
        showEmpty("expenseBreakdownEmpty", "expenseBreakdownChart");
        return;
    }

    hideEmpty("expenseBreakdownEmpty", "expenseBreakdownChart");

    // Group by category
    const catMap = {};
    expenses.forEach(function (t) {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(catMap);
    const values = Object.values(catMap);

    chartExpense = new Chart(
        document.getElementById("expenseBreakdownChart"),
        {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: CATEGORY_COLORS.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: "#fff",
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { animateScale: true, duration: 600 },
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { padding: 14, font: { size: 11 }, usePointStyle: true }
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
        }
    );
}


// ================================
// CHART 2 — PAYMENT SPLIT (Doughnut)
// ================================

function renderPaymentSplit(data) {
    chartPayment = destroyChart(chartPayment);

    if (data.length === 0) {
        showEmpty("paymentSplitEmpty", "paymentSplitChart");
        return;
    }

    hideEmpty("paymentSplitEmpty", "paymentSplitChart");

    const payMap = {};
    data.forEach(function (t) {
        payMap[t.payment] = (payMap[t.payment] || 0) + 1;
    });

    const labels = Object.keys(payMap);
    const values = Object.values(payMap);
    const payColors = ["#1f82a6", "#28a745", "#f0a500", "#6f42c1"];

    chartPayment = new Chart(
        document.getElementById("paymentSplitChart"),
        {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: payColors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: "#fff",
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { animateScale: true, duration: 600 },
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { padding: 14, font: { size: 11 }, usePointStyle: true }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                const total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                                const pct   = ((ctx.parsed / total) * 100).toFixed(1);
                                return " " + ctx.parsed + " transactions (" + pct + "%)";
                            }
                        }
                    }
                }
            }
        }
    );
}


// ================================
// CHART 3 — INCOME VS EXPENSE TREND (Line)
// ================================

function renderTrend(data) {
    chartTrend = destroyChart(chartTrend);

    if (data.length === 0) {
        showEmpty("trendEmpty", "trendChart");
        return;
    }

    hideEmpty("trendEmpty", "trendChart");

    // Group by date
    const incomeByDate  = {};
    const expenseByDate = {};

    data.forEach(function (t) {
        if (t.type === "Income") {
            incomeByDate[t.date]  = (incomeByDate[t.date]  || 0) + t.amount;
        } else {
            expenseByDate[t.date] = (expenseByDate[t.date] || 0) + t.amount;
        }
    });

    // Get all unique dates sorted
    const allDates = [...new Set(data.map(function (t) { return t.date; }))].sort();
    const labels   = allDates.map(formatShortDate);

    const incomeVals  = allDates.map(function (d) { return incomeByDate[d]  || 0; });
    const expenseVals = allDates.map(function (d) { return expenseByDate[d] || 0; });

    chartTrend = new Chart(
        document.getElementById("trendChart"),
        {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Income",
                        data: incomeVals,
                        borderColor: INCOME_COLOR,
                        backgroundColor: "rgba(40,167,69,0.08)",
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointBackgroundColor: INCOME_COLOR,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: "Expense",
                        data: expenseVals,
                        borderColor: EXPENSE_COLOR,
                        backgroundColor: "rgba(220,53,69,0.08)",
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointBackgroundColor: EXPENSE_COLOR,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 600 },
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { padding: 16, font: { size: 12 }, usePointStyle: true }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                return " " + ctx.dataset.label + ": ₹" + ctx.parsed.y.toLocaleString("en-IN");
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
                        grid: { display: false },
                        ticks: { font: { size: 11 }, maxRotation: 45 }
                    }
                }
            }
        }
    );
}


// ================================
// CHART 4 — DAILY SPENDING PATTERN (Bar)
// ================================

function renderDailyPattern(data) {
    chartDaily = destroyChart(chartDaily);

    const expenses = data.filter(function (t) { return t.type === "Expense"; });

    if (expenses.length === 0) {
        showEmpty("dailyPatternEmpty", "dailyPatternChart");
        return;
    }

    hideEmpty("dailyPatternEmpty", "dailyPatternChart");

    // Day totals — 0=Sun, 1=Mon ... 6=Sat
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    expenses.forEach(function (t) {
        const d   = new Date(t.date);
        const day = d.getDay();
        dayTotals[day] += t.amount;
        dayCounts[day]++;
    });

    // Average per day (Mon first)
    const dayLabels  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayOrder   = [1, 2, 3, 4, 5, 6, 0];
    const avgByDay   = dayOrder.map(function (d) {
        return dayCounts[d] > 0 ? Math.round(dayTotals[d] / dayCounts[d]) : 0;
    });

    // Color weekend bars differently
    const barColors = dayLabels.map(function (d) {
        return (d === "Sat" || d === "Sun") ? "#fd7e14" : EXPENSE_COLOR;
    });

    chartDaily = new Chart(
        document.getElementById("dailyPatternChart"),
        {
            type: "bar",
            data: {
                labels: dayLabels,
                datasets: [{
                    label: "Avg Spend",
                    data: avgByDay,
                    backgroundColor: barColors,
                    borderRadius: 6,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 600 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                return " Avg ₹" + ctx.parsed.y.toLocaleString("en-IN");
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
                                return v >= 1000 ? "₹" + (v/1000).toFixed(0) + "k" : "₹" + v;
                            },
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 12 } }
                    }
                }
            }
        }
    );
}


// ================================
// CHART 5 — SAVINGS RATE TREND (Line)
// ================================

function renderSavingsRate(data) {
    chartSavings = destroyChart(chartSavings);

    if (data.length === 0) {
        showEmpty("savingsRateEmpty", "savingsRateChart");
        return;
    }

    // Group by date
    const incomeByDate  = {};
    const expenseByDate = {};

    data.forEach(function (t) {
        if (t.type === "Income") {
            incomeByDate[t.date]  = (incomeByDate[t.date]  || 0) + t.amount;
        } else {
            expenseByDate[t.date] = (expenseByDate[t.date] || 0) + t.amount;
        }
    });

    const allDates = [...new Set(data.map(function (t) { return t.date; }))].sort();

    // Calculate cumulative savings rate per date
    let cumIncome  = 0;
    let cumExpense = 0;

    const rates = allDates.map(function (d) {
        cumIncome  += incomeByDate[d]  || 0;
        cumExpense += expenseByDate[d] || 0;
        if (cumIncome === 0) return 0;
        return Math.round(((cumIncome - cumExpense) / cumIncome) * 100);
    });

    const hasData = rates.some(function (r) { return r !== 0; });
    if (!hasData) {
        showEmpty("savingsRateEmpty", "savingsRateChart");
        return;
    }

    hideEmpty("savingsRateEmpty", "savingsRateChart");

    const labels = allDates.map(formatShortDate);

    chartSavings = new Chart(
        document.getElementById("savingsRateChart"),
        {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Savings Rate %",
                    data: rates,
                    borderColor: SAVINGS_COLOR,
                    backgroundColor: "rgba(31,130,166,0.1)",
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: SAVINGS_COLOR,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 600 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                return " Savings Rate: " + ctx.parsed.y + "%";
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { color: "#f0f0f0" },
                        ticks: {
                            callback: function (v) { return v + "%"; },
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 }, maxRotation: 45 }
                    }
                }
            }
        }
    );
}


// ================================
// TOP CATEGORIES (Horizontal Bars — no chart.js)
// ================================

function renderTopCategories(data) {
    const container = document.getElementById("topCategories");
    const emptyEl   = document.getElementById("topCategoriesEmpty");

    const expenses = data.filter(function (t) { return t.type === "Expense"; });

    if (expenses.length === 0) {
        emptyEl.classList.add("visible");
        // Remove old items
        container.querySelectorAll(".category-bar-item").forEach(function (el) {
            el.remove();
        });
        return;
    }

    emptyEl.classList.remove("visible");

    // Group by category
    const catMap  = {};
    const emojiMap = {};

    expenses.forEach(function (t) {
        catMap[t.category]   = (catMap[t.category]  || 0) + t.amount;
        emojiMap[t.category] = t.emoji || "💰";
    });

    // Sort by amount desc, take top 6
    const sorted = Object.entries(catMap)
        .sort(function (a, b) { return b[1] - a[1]; })
        .slice(0, 6);

    const maxAmt = sorted[0][1];

    // Remove old items
    container.querySelectorAll(".category-bar-item").forEach(function (el) {
        el.remove();
    });

    // Render each
    sorted.forEach(function (entry, index) {
        const [name, amount] = entry;
        const pct = Math.round((amount / maxAmt) * 100);
        const totalExpense = expenses.reduce(function (s, t) { return s + t.amount; }, 0);
        const sharePct = Math.round((amount / totalExpense) * 100);

        const div = document.createElement("div");
        div.classList.add("category-bar-item");
        div.innerHTML = `
            <span class="cat-rank">#${index + 1}</span>
            <span class="cat-emoji">${emojiMap[name]}</span>
            <div class="cat-info">
                <div class="cat-name">${name}</div>
                <div class="cat-bar-track">
                    <div class="cat-bar-fill" style="width:${pct}%; background:${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}"></div>
                </div>
            </div>
            <span class="cat-amount">₹${amount.toLocaleString("en-IN")}</span>
            <span class="cat-pct">${sharePct}%</span>
        `;

        container.appendChild(div);
    });
}


// ================================
// INIT
// ================================

(function init() {
    // Set default period pill to "Last 7 Days"
    const pills = document.querySelectorAll(".period-pill");
    pills.forEach(function (p) { p.classList.remove("active"); });
    pills[0].classList.add("active");
    currentPeriod = "7days";

    renderAll();
})();