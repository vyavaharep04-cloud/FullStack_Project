// ================================
// FINANCIAL HEALTH PAGE — JS
// FinanTra | Smart Tools
// ================================


// ================================
// STATE
// ================================

var currentPeriod = "month";

var CAT_COLORS = [
    "#1f82a6","#28a745","#dc3545","#f0a500",
    "#6f42c1","#fd7e14","#20c997","#e83e8c"
];


// ================================
// DATE HELPERS
// ================================

function getPeriodStart(period) {
    var now = new Date();
    if (period === "month") {
        return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-01";
    }
    if (period === "3months") {
        var d = new Date();
        d.setMonth(d.getMonth() - 3);
        return d.toISOString().split("T")[0];
    }
    if (period === "year") {
        return now.getFullYear() + "-01-01";
    }
    return null;
}

function filterByPeriod(transactions, period) {
    var start = getPeriodStart(period);
    if (!start) return transactions;
    return transactions.filter(function (t) { return t.date >= start; });
}

function calcSummary(transactions) {
    var income = 0, expense = 0;
    transactions.forEach(function (t) {
        if (t.type === "Income") income  += parseFloat(t.amount);
        else                     expense += parseFloat(t.amount);
    });
    return { income: income, expense: expense, savings: income - expense };
}

function fmtINR(n) {
    return "₹ " + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

// Previous month key helpers — used by DataService.getFHScore / saveFHScore
function getPrevMonthYM() {
    var now = new Date();
    var y   = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    var m   = now.getMonth() === 0 ? 12 : now.getMonth(); // 1-indexed
    return { y: y, m: m };
}

function getCurrMonthYM() {
    var now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1 }; // 1-indexed
}


// ================================
// PERIOD SELECTOR
// ================================

var PERIOD_LABELS = {
    "month":   "This Month",
    "3months": "Last 3 Months",
    "year":    "This Year"
};

async function setPeriod(period, btn) {
    currentPeriod = period;
    document.querySelectorAll(".period-pill").forEach(function (p) {
        p.classList.remove("active");
    });
    btn.classList.add("active");
    await renderAll();
}


// ================================
// SCORE CALCULATION
// ================================

async function calcScores(transactions, period) {
    var data    = filterByPeriod(transactions, period);
    var summary = calcSummary(data);
    var income  = summary.income;
    var expense = summary.expense;
    var savings = summary.savings;

    // ── 1. Savings Ratio (40%) ──
    var savingsRate = income > 0 ? (savings / income) * 100 : 0;
    var savingsScore;
    if (income === 0)           savingsScore = 50;
    else if (savingsRate >= 50) savingsScore = 100;
    else if (savingsRate >= 30) savingsScore = 80 + (savingsRate - 30) * 1;
    else if (savingsRate >= 20) savingsScore = 60 + (savingsRate - 20) * 2;
    else if (savingsRate >= 10) savingsScore = 40 + (savingsRate - 10) * 2;
    else if (savingsRate >= 0)  savingsScore = savingsRate * 4;
    else savingsScore = 0;
    savingsScore = Math.round(Math.max(0, Math.min(100, savingsScore)));

    // ── 2. Expense Control (30%) ──
    var expenseRatio = income > 0 ? (expense / income) * 100 : 100;
    var expenseScore;
    if (income === 0)              expenseScore = 50;
    else if (expenseRatio <= 50)   expenseScore = 100;
    else if (expenseRatio <= 70)   expenseScore = 100 - (expenseRatio - 50) * 2.5;
    else if (expenseRatio <= 90)   expenseScore = 50  - (expenseRatio - 70) * 1.5;
    else if (expenseRatio <= 100)  expenseScore = 20  - (expenseRatio - 90) * 2;
    else expenseScore = 0;
    expenseScore = Math.round(Math.max(0, Math.min(100, expenseScore)));

    // ── 3. Income Stability (20%) ──
    var incomeTxns = data.filter(function (t) { return t.type === "Income"; }).length;
    var incomeScore;
    if      (incomeTxns === 0) incomeScore = 0;
    else if (incomeTxns === 1) incomeScore = 40;
    else if (incomeTxns <= 3)  incomeScore = 70;
    else if (incomeTxns <= 6)  incomeScore = 85;
    else                       incomeScore = 100;

    // ── 4. Budget Adherence (10%) ──
    // await because it fetches budget data via DataService
    var budgetScore = await calcBudgetAdherence(period, transactions);

    // ── Final weighted score ──
    var finalScore = Math.round(
        savingsScore  * 0.40 +
        expenseScore  * 0.30 +
        incomeScore   * 0.20 +
        budgetScore   * 0.10
    );

    return {
        final:        finalScore,
        savings:      savingsScore,
        expense:      expenseScore,
        income:       incomeScore,
        budget:       budgetScore,
        savingsRate:  Math.round(savingsRate),
        expenseRatio: Math.round(expenseRatio),
        incomeTxns:   incomeTxns,
        totalIncome:  income,
        totalExpense: expense,
        totalSavings: savings,
        hasData:      data.length > 0
    };
}

// transactions passed in — already fetched by renderAll, no second fetch
async function calcBudgetAdherence(period, transactions) {
    var now    = new Date();
    var months = [];

    if (period === "month") {
        months.push({ y: now.getFullYear(), m: now.getMonth() + 1 });
    } else if (period === "3months") {
        for (var i = 0; i < 3; i++) {
            var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ y: d.getFullYear(), m: d.getMonth() + 1 }); // 1-indexed
        }
    } else if (period === "year") {
        for (var i = 0; i <= now.getMonth(); i++) {
            months.push({ y: now.getFullYear(), m: i + 1 }); // 1-indexed
        }
    }

    var totalCats  = 0;
    var withinCats = 0;

    for (var mo of months) {
        var budget = await DataService.getBudget(mo.y, mo.m);
        var cats   = (budget && budget.categories) ? budget.categories : [];

        // month prefix for filtering — mo.m is already 1-indexed
        var prefix = mo.y + "-" + String(mo.m).padStart(2, "0");
        var monthTxns = transactions.filter(function (t) {
            return t.date && t.date.indexOf(prefix) === 0 && t.type === "Expense";
        });

        cats.forEach(function (cat) {
            // DataService returns categories with "category" field (not "label")
            var limit = cat.limit || 0;
            var name  = cat.category || cat.label || "";
            if (limit > 0) {
                totalCats++;
                var spent = monthTxns
                    .filter(function (t) { return t.category === name; })
                    .reduce(function (s, t) { return s + parseFloat(t.amount); }, 0);
                if (spent <= limit) withinCats++;
            }
        });
    }

    if (totalCats === 0) return 70; // no budget data, neutral-ish
    return Math.round((withinCats / totalCats) * 100);
}

function getScoreBand(score) {
    if (score >= 80) return { label: "Excellent",          cls: "excellent" };
    if (score >= 60) return { label: "Good",               cls: "good"      };
    if (score >= 40) return { label: "Needs Improvement",  cls: "improve"   };
    return               { label: "Risky",              cls: "risky"     };
}


// ================================
// RENDER GAUGE
// ================================

async function renderGauge(score, band) {
    var fill    = document.getElementById("fhGaugeFill");
    var numEl   = document.getElementById("fhScoreNumber");
    var labelEl = document.getElementById("fhScoreLabel");
    var trendEl = document.getElementById("fhScoreTrend");

    // circumference of r=80 circle ≈ 502.65
    var circumference = 2 * Math.PI * 80;
    var offset        = circumference - (score / 100) * circumference;

    fill.style.strokeDashoffset = offset;
    fill.className = "fh-gauge-fill " + band.cls;

    numEl.textContent   = score;
    labelEl.textContent = band.label;

    // Trend vs last month (only for "month" period)
    trendEl.textContent = "";
    trendEl.className   = "fh-score-trend";

    if (currentPeriod === "month") {
        var curr = getCurrMonthYM();
        var prev = getPrevMonthYM();

        // Save current score via DataService
        await DataService.saveFHScore(curr.y, curr.m, { score: score });

        // Load previous month score via DataService
        var prevData = await DataService.getFHScore(prev.y, prev.m);
        if (prevData && prevData.score !== undefined) {
            var prevScore = parseInt(prevData.score);
            if (!isNaN(prevScore)) {
                var diff = score - prevScore;
                if (diff > 0) {
                    trendEl.innerHTML = '<i class="fa-solid fa-arrow-trend-up"></i> +' + diff + ' vs last month';
                    trendEl.classList.add("up");
                } else if (diff < 0) {
                    trendEl.innerHTML = '<i class="fa-solid fa-arrow-trend-down"></i> ' + diff + ' vs last month';
                    trendEl.classList.add("down");
                } else {
                    trendEl.innerHTML = '<i class="fa-solid fa-minus"></i> Same as last month';
                    trendEl.classList.add("same");
                }
            }
        }
    }
}


// ================================
// RENDER SUB-SCORES
// ================================

function renderSubscores(scores) {
    var items = [
        {
            scoreId: "fhSavingsScore",
            fillId:  "fhSavingsFill",
            hintId:  "fhSavingsHint",
            score:   scores.savings,
            hint:    scores.totalIncome > 0
                ? "Savings rate: " + scores.savingsRate + "% of income"
                : "No income data for this period"
        },
        {
            scoreId: "fhExpenseScore",
            fillId:  "fhExpenseFill",
            hintId:  "fhExpenseHint",
            score:   scores.expense,
            hint:    scores.totalIncome > 0
                ? "Spending " + scores.expenseRatio + "% of income on expenses"
                : "No income data for this period"
        },
        {
            scoreId: "fhIncomeScore",
            fillId:  "fhIncomeFill",
            hintId:  "fhIncomeHint",
            score:   scores.income,
            hint:    scores.incomeTxns + " income transaction" + (scores.incomeTxns !== 1 ? "s" : "") + " this period"
        },
        {
            scoreId: "fhBudgetScore",
            fillId:  "fhBudgetFill",
            hintId:  "fhBudgetHint",
            score:   scores.budget,
            hint:    "Based on budget categories staying within limits"
        }
    ];

    items.forEach(function (item) {
        var band = getScoreBand(item.score);
        document.getElementById(item.scoreId).textContent = item.score;
        document.getElementById(item.hintId).textContent  = item.hint;

        var fillEl = document.getElementById(item.fillId);
        fillEl.style.width = item.score + "%";
        fillEl.className   = "fh-subscore-fill " + band.cls;
    });
}


// ================================
// RENDER INCOME VS EXPENSES
// ================================

function renderIncExp(scores) {
    var income  = scores.totalIncome;
    var expense = scores.totalExpense;
    var balance = scores.totalSavings;
    var max     = Math.max(income, expense, 1);

    document.getElementById("fhIncome").textContent  = fmtINR(income);
    document.getElementById("fhExpense").textContent = fmtINR(expense);

    var balEl = document.getElementById("fhBalance");
    balEl.textContent = (balance >= 0 ? "" : "-") + fmtINR(Math.abs(balance));
    balEl.style.color = balance >= 0 ? "#28a745" : "#dc3545";

    document.getElementById("fhIncomeFill2").style.width  = Math.round((income  / max) * 100) + "%";
    document.getElementById("fhExpenseFill2").style.width = Math.round((expense / max) * 100) + "%";
    document.getElementById("fhIncomePct").textContent    = income  > 0 ? Math.round((income  / max) * 100) + "%" : "0%";
    document.getElementById("fhExpensePct").textContent   = expense > 0 ? Math.round((expense / max) * 100) + "%" : "0%";

    var label = PERIOD_LABELS[currentPeriod] || "";
    document.getElementById("fhIncExpLabel").textContent = label;

    // Insight line
    var insightEl = document.getElementById("fhIeInsight");
    if (income === 0 && expense === 0) {
        insightEl.className = "fh-ie-insight warning";
        insightEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> No transaction data for this period. Add transactions to see insights.';
    } else if (balance > 0) {
        var rate = Math.round((balance / income) * 100);
        insightEl.className = "fh-ie-insight positive";
        insightEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> You saved ' + fmtINR(balance) + ' (' + rate + '% of income) this period. Great discipline!';
    } else if (balance === 0) {
        insightEl.className = "fh-ie-insight warning";
        insightEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Income exactly equals expenses. Try to save at least 10–20% of your income.';
    } else {
        insightEl.className = "fh-ie-insight critical";
        insightEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Expenses exceed income by ' + fmtINR(Math.abs(balance)) + '. Review your spending immediately.';
    }
}


// ================================
// RENDER BUDGET SNAPSHOT
// ================================

async function renderBudgetSnapshot() {
    var now    = new Date();
    var year   = now.getFullYear();
    var month  = now.getMonth() + 1; // 1-indexed for DataService

    var budget = await DataService.getBudget(year, month);
    var cats   = (budget && budget.categories) ? budget.categories : [];

    var el = document.getElementById("fhBudgetSnapshot");
    el.innerHTML = "";

    if (cats.length === 0) {
        el.innerHTML = '<div class="fh-snapshot-empty">No budget set for this month.<br><a href="budgetPlanner.html" style="color:#1f82a6;">Set up Budget Planner →</a></div>';
        return;
    }

    // Get current month spending via DataService
    var allTxns = await DataService.getTransactions();
    var prefix  = year + "-" + String(month).padStart(2, "0");
    var txns    = allTxns.filter(function (t) {
        return t.date && t.date.indexOf(prefix) === 0 && t.type === "Expense";
    });

    var totalSpent    = txns.reduce(function (s, t) { return s + parseFloat(t.amount); }, 0);
    var totalBudgeted = cats.reduce(function (s, c) { return s + (c.limit || 0); }, 0);
    var withinCount   = 0;

    cats.forEach(function (cat) {
        var name  = cat.category || cat.label || "";
        var limit = cat.limit || 0;
        var spent = txns.filter(function (t) { return t.category === name; })
                        .reduce(function (s, t) { return s + parseFloat(t.amount); }, 0);
        if (spent <= limit) withinCount++;
    });

    var overallPct = totalBudgeted > 0 ? Math.min(Math.round((totalSpent / totalBudgeted) * 100), 200) : 0;
    var fillCls    = overallPct >= 100 ? "over" : overallPct >= 75 ? "warn" : "good";

    el.innerHTML +=
        '<div class="fh-snap-stat">' +
            '<span class="fh-snap-stat-label"><i class="fa-solid fa-chart-bar"></i> Spent vs Budget</span>' +
            '<span class="fh-snap-stat-val">' + fmtINR(totalSpent) + ' / ' + fmtINR(totalBudgeted) + '</span>' +
        '</div>' +
        '<div class="fh-snap-progress">' +
            '<div class="fh-snap-bar"><div class="fh-snap-fill ' + fillCls + '" style="width:' + Math.min(overallPct, 100) + '%"></div></div>' +
        '</div>' +
        '<div class="fh-snap-stat">' +
            '<span class="fh-snap-stat-label"><i class="fa-solid fa-circle-check"></i> Categories within limit</span>' +
            '<span class="fh-snap-stat-val">' + withinCount + ' / ' + cats.length + '</span>' +
        '</div>';

    // Monthly cap — check if budget has a cap field
    var cap = (budget && budget.cap) ? budget.cap : 0;
    if (cap > 0) {
        var capPct     = Math.min(Math.round((totalSpent / cap) * 100), 200);
        var capFillCls = capPct >= 100 ? "over" : capPct >= 75 ? "warn" : "good";
        el.innerHTML +=
            '<div class="fh-snap-stat">' +
                '<span class="fh-snap-stat-label"><i class="fa-solid fa-bullseye"></i> Monthly cap used</span>' +
                '<span class="fh-snap-stat-val">' + capPct + '%</span>' +
            '</div>' +
            '<div class="fh-snap-progress">' +
                '<div class="fh-snap-bar"><div class="fh-snap-fill ' + capFillCls + '" style="width:' + Math.min(capPct, 100) + '%"></div></div>' +
            '</div>';
    }
}


// ================================
// RENDER GOALS SNAPSHOT
// ================================

async function renderGoalsSnapshot() {
    var goals = await DataService.getGoals();
    var el    = document.getElementById("fhGoalsSnapshot");
    el.innerHTML = "";

    if (goals.length === 0) {
        el.innerHTML = '<div class="fh-snapshot-empty">No savings goals set.<br><a href="savingsGoal.html" style="color:#1f82a6;">Create a Goal →</a></div>';
        return;
    }

    var achieved  = goals.filter(function (g) { return g.savedAmount >= g.targetAmount; });
    var active    = goals.filter(function (g) { return g.savedAmount <  g.targetAmount; });
    var totTarget = active.reduce(function (s, g) { return s + g.targetAmount; }, 0);
    var totSaved  = active.reduce(function (s, g) { return s + g.savedAmount;  }, 0);
    var overallPct = totTarget > 0 ? Math.min(Math.round((totSaved / totTarget) * 100), 100) : 0;

    el.innerHTML =
        '<div class="fh-snap-stat">' +
            '<span class="fh-snap-stat-label"><i class="fa-solid fa-list-check"></i> Active Goals</span>' +
            '<span class="fh-snap-stat-val">' + active.length + '</span>' +
        '</div>' +
        '<div class="fh-snap-stat">' +
            '<span class="fh-snap-stat-label"><i class="fa-solid fa-trophy"></i> Goals Achieved</span>' +
            '<span class="fh-snap-stat-val" style="color:#28a745;">' + achieved.length + '</span>' +
        '</div>' +
        '<div class="fh-snap-stat">' +
            '<span class="fh-snap-stat-label"><i class="fa-solid fa-coins"></i> Total Saved</span>' +
            '<span class="fh-snap-stat-val">' + fmtINR(totSaved) + '</span>' +
        '</div>' +
        '<div class="fh-snap-progress">' +
            '<div class="fh-snap-bar">' +
                '<div class="fh-snap-fill good" style="width:' + overallPct + '%"></div>' +
            '</div>' +
        '</div>';
}


// ================================
// RENDER EXPENSE BREAKDOWN
// (pure — receives data as param, no async needed)
// ================================

function renderExpenseBreakdown(transactions) {
    var data     = filterByPeriod(transactions, currentPeriod);
    var expenses = data.filter(function (t) { return t.type === "Expense"; });
    var el       = document.getElementById("fhExpenseBreakdown");
    var emptyEl  = document.getElementById("fhBreakdownEmpty");

    el.innerHTML = "";

    if (expenses.length === 0) {
        emptyEl.classList.add("visible");
        return;
    }

    emptyEl.classList.remove("visible");

    var catMap   = {};
    var emojiMap = {};
    var total    = 0;

    expenses.forEach(function (t) {
        catMap[t.category]   = (catMap[t.category]  || 0) + parseFloat(t.amount);
        emojiMap[t.category] = t.emoji || "📦";
        total += parseFloat(t.amount);
    });

    var sorted = Object.entries(catMap)
        .sort(function (a, b) { return b[1] - a[1]; })
        .slice(0, 6);

    var maxAmt = sorted[0][1];

    sorted.forEach(function (entry, idx) {
        var name     = entry[0];
        var amount   = entry[1];
        var barPct   = Math.round((amount / maxAmt) * 100);
        var sharePct = Math.round((amount / total)  * 100);
        var isHigh   = sharePct > 30;

        var row = document.createElement("div");
        row.className = "fh-exp-row";
        row.innerHTML =
            '<span class="fh-exp-rank">#' + (idx + 1) + '</span>' +
            '<span class="fh-exp-emoji">' + (emojiMap[name] || "📦") + '</span>' +
            '<div class="fh-exp-info">' +
                '<div class="fh-exp-name">' + name + '</div>' +
                (isHigh ? '<div class="fh-exp-warn">⚠️ High — ' + sharePct + '% of total spending</div>' : '') +
                '<div class="fh-exp-bar-track">' +
                    '<div class="fh-exp-bar-fill" style="width:' + barPct + '%;background:' + CAT_COLORS[idx % CAT_COLORS.length] + '"></div>' +
                '</div>' +
            '</div>' +
            '<span class="fh-exp-amount">' + fmtINR(amount) + '</span>' +
            '<span class="fh-exp-pct">' + sharePct + '%</span>';

        el.appendChild(row);
    });
}


// ================================
// GENERATE SMART INSIGHTS
// ================================

function generateInsights(scores, transactions) {
    var data     = filterByPeriod(transactions, currentPeriod);
    var summary  = calcSummary(data);
    var income   = summary.income;
    var expense  = summary.expense;
    var savings  = summary.savings;
    var insights = [];

    // ── DYNAMIC INSIGHTS ──

    if (income > 0 && expense > income) {
        insights.push({
            type:  "critical",
            title: "Expenses Exceed Income",
            desc:  "You are spending " + fmtINR(expense - income) + " more than you earn. This is unsustainable — review your expenses immediately."
        });
    }

    if (income > 0 && savings < 0) {
        insights.push({
            type:  "critical",
            title: "Negative Savings",
            desc:  "Your spending exceeds your income. Cut discretionary expenses and track every rupee."
        });
    }

    if (income > 0 && savings >= 0 && scores.savingsRate < 10) {
        insights.push({
            type:  "warning",
            title: "Low Savings Rate (" + scores.savingsRate + "%)",
            desc:  "Financial experts recommend saving at least 20% of income. Try to save " + fmtINR(income * 0.2) + " per month."
        });
    }

    if (income > 0 && scores.savingsRate >= 10 && scores.savingsRate < 20) {
        insights.push({
            type:  "warning",
            title: "Savings Rate Can Improve",
            desc:  "You save " + scores.savingsRate + "% of income. Aim for 20%+ — that's " + fmtINR(income * 0.2 - savings) + " more per month."
        });
    }

    if (income > 0 && scores.savingsRate >= 30) {
        insights.push({
            type:  "positive",
            title: "Excellent Savings Rate 🎉",
            desc:  "You save " + scores.savingsRate + "% of income. Keep it up — you're building strong financial habits!"
        });
    }

    var catMap = {};
    data.filter(function (t) { return t.type === "Expense"; }).forEach(function (t) {
        catMap[t.category] = (catMap[t.category] || 0) + parseFloat(t.amount);
    });

    var catEntries = Object.entries(catMap).sort(function (a, b) { return b[1] - a[1]; });
    if (catEntries.length > 0 && expense > 0) {
        var topCat   = catEntries[0];
        var topShare = Math.round((topCat[1] / expense) * 100);
        if (topShare > 35) {
            insights.push({
                type:  "warning",
                title: "High Spending on " + topCat[0],
                desc:  topCat[0] + " accounts for " + topShare + "% of total expenses (" + fmtINR(topCat[1]) + "). Consider reducing this category."
            });
        }
    }

    if (scores.budget < 50) {
        insights.push({
            type:  "warning",
            title: "Budget Limits Frequently Exceeded",
            desc:  "Multiple budget categories are over their limits. Review your Budget Planner and adjust limits or spending."
        });
    }

    if (scores.incomeTxns === 0) {
        insights.push({
            type:  "warning",
            title: "No Income Recorded",
            desc:  "No income transactions found for this period. Add your salary or income sources to get accurate insights."
        });
    }

    if (scores.final >= 80) {
        insights.push({
            type:  "positive",
            title: "Excellent Financial Health! 🏆",
            desc:  "Your overall score of " + scores.final + " puts you in excellent shape. Keep maintaining these habits."
        });
    }

    if (data.length === 0) {
        insights.push({
            type:  "warning",
            title: "No Data for This Period",
            desc:  "Add transactions to get personalized financial insights for this period."
        });
    }

    // ── FIXED MOTIVATIONAL TIPS ──
    var fixedTips = [
        {
            type:  "positive",
            title: "💡 50/30/20 Rule",
            desc:  "A good budgeting framework: 50% on needs, 30% on wants, 20% on savings. How does your breakdown compare?"
        },
        {
            type:  "positive",
            title: "💡 Emergency Fund",
            desc:  "Financial experts recommend keeping 3–6 months of expenses as an emergency fund. Consider setting a Savings Goal for this."
        },
        {
            type:  "positive",
            title: "💡 Track Every Rupee",
            desc:  "Consistent transaction tracking is the first step to financial health. The more data you add, the smarter your insights become."
        }
    ];

    insights.push(fixedTips[new Date().getDate() % fixedTips.length]);

    // Sort: critical → warning → positive
    var order = { critical: 0, warning: 1, positive: 2 };
    insights.sort(function (a, b) { return order[a.type] - order[b.type]; });

    return insights;
}

function renderInsights(scores, transactions) {
    var insights = generateInsights(scores, transactions);
    var listEl   = document.getElementById("fhInsightsList");
    var emptyEl  = document.getElementById("fhInsightsEmpty");
    var countEl  = document.getElementById("fhInsightCount");

    listEl.innerHTML = "";
    countEl.textContent = insights.length + " insight" + (insights.length !== 1 ? "s" : "");

    if (insights.length === 0) {
        emptyEl.classList.add("visible");
        return;
    }

    emptyEl.classList.remove("visible");

    var iconMap  = { critical: "fa-circle-exclamation", warning: "fa-triangle-exclamation", positive: "fa-circle-check" };
    var badgeMap = { critical: "Critical", warning: "Warning", positive: "Positive" };

    insights.forEach(function (ins) {
        var item = document.createElement("div");
        item.className = "fh-insight-item " + ins.type;
        item.innerHTML =
            '<div class="fh-insight-icon ' + ins.type + '">' +
                '<i class="fa-solid ' + iconMap[ins.type] + '"></i>' +
            '</div>' +
            '<div class="fh-insight-text">' +
                '<div class="fh-insight-title">' + ins.title + '</div>' +
                '<div class="fh-insight-desc">'  + ins.desc  + '</div>' +
            '</div>' +
            '<span class="fh-insight-badge ' + ins.type + '">' + badgeMap[ins.type] + '</span>';
        listEl.appendChild(item);
    });
}


// ================================
// RENDER ALL
// ================================

async function renderAll() {
    try {
        // Single fetch — passed down to all functions that need it
        var transactions = await DataService.getTransactions();
        var scores       = await calcScores(transactions, currentPeriod);
        var band         = getScoreBand(scores.final);

        document.getElementById("fhScorePeriodLabel").textContent = PERIOD_LABELS[currentPeriod] || "";

        await renderGauge(scores.final, band);
        renderSubscores(scores);
        renderIncExp(scores);
        await renderBudgetSnapshot();
        await renderGoalsSnapshot();
        renderExpenseBreakdown(transactions);
        renderInsights(scores, transactions);

    } catch (err) {
        console.error("financialHealth renderAll error:", err);
    }
}


// ================================
// INIT
// ================================

(async function init() {
    await renderAll();
})();