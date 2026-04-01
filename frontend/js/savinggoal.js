// ================================
// SAVINGS GOAL PLANNER — JS
// FinanTra | Smart Tools
// ================================


// ================================
// CONSTANTS
// ================================

var STORAGE_KEY = "finantra_savings_goals";

var EMOJI_OPTIONS = [
    "🏠", "✈️", "💻", "🚗", "📱", "🎓", "💍", "🏖️",
    "🎸", "💪", "🌍", "🛒", "📸", "🏋️", "🎯", "💰"
];

var MONTH_NAMES = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
];


// ================================
// STORAGE HELPERS
// ================================

function loadGoals() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveGoals(goals) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}


// ================================
// FORMATTING HELPERS
// ================================

function fmtINR(n) {
    return "₹ " + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function fmtDate(dateStr) {
    if (!dateStr) return "—";
    var parts  = dateStr.split("-");
    var day    = parseInt(parts[2]);
    var month  = parseInt(parts[1]) - 1;
    var year   = parts[0];
    return day + " " + MONTH_NAMES[month] + " " + year;
}

function monthsLeft(deadlineStr) {
    var now      = new Date();
    var deadline = new Date(deadlineStr);
    var months   = (deadline.getFullYear() - now.getFullYear()) * 12 +
                   (deadline.getMonth() - now.getMonth());
    return Math.max(months, 0);
}

function daysLeft(deadlineStr) {
    var now      = new Date();
    now.setHours(0,0,0,0);
    var deadline = new Date(deadlineStr);
    var diff     = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diff;
}

function timeLeftLabel(deadlineStr) {
    var days   = daysLeft(deadlineStr);
    var months = monthsLeft(deadlineStr);
    if (days < 0)   return { text: "Overdue by " + Math.abs(days) + " day" + (Math.abs(days) !== 1 ? "s" : ""), overdue: true };
    if (days === 0) return { text: "Due today!", overdue: false };
    if (days < 30)  return { text: days + " day" + (days !== 1 ? "s" : "") + " left", overdue: false };
    return { text: months + " month" + (months !== 1 ? "s" : "") + " left", overdue: false };
}


// ================================
// AUTO STATUS CALCULATION
// Based on time elapsed vs % saved
// ================================

function calcAutoStatus(goal) {
    var target  = goal.targetAmount;
    var saved   = goal.savedAmount;
    var pct     = target > 0 ? (saved / target) * 100 : 0;

    var created  = new Date(goal.createdAt);
    var deadline = new Date(goal.deadline);
    var now      = new Date();

    var totalMs   = deadline - created;
    var elapsedMs = now - created;
    var timeElapsedPct = totalMs > 0 ? Math.min((elapsedMs / totalMs) * 100, 100) : 100;

    // Expected % saved by now
    var expectedPct = timeElapsedPct;
    var diff        = pct - expectedPct;

    if (pct >= 100)      return "achieved";
    if (diff >= -10)     return "on-track";
    if (diff >= -30)     return "behind";
    return "critical";
}

function getEffectiveStatus(goal) {
    if (goal.statusOverride && goal.statusOverride !== "auto") {
        return goal.statusOverride;
    }
    return calcAutoStatus(goal);
}


// ================================
// SUMMARY STRIP
// ================================

function renderSummary(goals) {
    var active   = goals.filter(function (g) { return !isAchieved(g); });
    var achieved = goals.filter(function (g) { return isAchieved(g); });
    var totTarget = active.reduce(function (s, g) { return s + g.targetAmount; }, 0);
    var totSaved  = active.reduce(function (s, g) { return s + g.savedAmount; }, 0);

    document.getElementById("sgSumActive").textContent   = active.length;
    document.getElementById("sgSumTarget").textContent   = fmtINR(totTarget);
    document.getElementById("sgSumSaved").textContent    = fmtINR(totSaved);
    document.getElementById("sgSumAchieved").textContent = achieved.length;
}

function isAchieved(goal) {
    return goal.savedAmount >= goal.targetAmount;
}


// ================================
// RENDER ALL GOALS
// ================================

function renderAll() {
    var goals    = loadGoals();
    var active   = goals.filter(function (g) { return !isAchieved(g); });
    var achieved = goals.filter(function (g) { return isAchieved(g); });

    renderSummary(goals);

    var listEl = document.getElementById("sgGoalsList");
    listEl.innerHTML = "";

    // Empty state
    if (active.length === 0) {
        document.getElementById("sgEmpty").classList.add("visible");
    } else {
        document.getElementById("sgEmpty").classList.remove("visible");
        active.forEach(function (goal, i) {
            listEl.appendChild(buildGoalCard(goal, i, active.length, false));
        });
    }

    // Achieved section
    var achievedSection = document.getElementById("sgAchievedSection");
    var achievedList    = document.getElementById("sgAchievedList");
    var achievedCount   = document.getElementById("sgAchievedCount");

    if (achieved.length > 0) {
        achievedSection.classList.add("visible");
        achievedCount.textContent = achieved.length;
        achievedList.innerHTML    = "";
        achieved.forEach(function (goal) {
            achievedList.appendChild(buildGoalCard(goal, -1, -1, true));
        });
    } else {
        achievedSection.classList.remove("visible");
    }
}


// ================================
// BUILD GOAL CARD
// ================================

function buildGoalCard(goal, activeIdx, totalActive, isAchievedCard) {
    var card    = document.createElement("div");
    var pCls    = "priority-" + (goal.priority || "medium").toLowerCase();
    card.className = "sg-goal-card " + pCls + (isAchievedCard ? " achieved" : "");
    card.dataset.id = goal.id;

    var target   = goal.targetAmount;
    var saved    = goal.savedAmount;
    var remain   = Math.max(target - saved, 0);
    var pct      = target > 0 ? Math.min(Math.round((saved / target) * 100), 100) : 0;
    var status   = getEffectiveStatus(goal);
    var mLeft    = monthsLeft(goal.deadline);
    var monthly  = mLeft > 0 ? Math.ceil(remain / mLeft) : remain;
    var timeInfo = timeLeftLabel(goal.deadline);

    // Expected saved by now (for comparison bar)
    var created        = new Date(goal.createdAt);
    var deadline       = new Date(goal.deadline);
    var now            = new Date();
    var totalMs        = deadline - created;
    var elapsedMs      = now - created;
    var expectedPct    = totalMs > 0 ? Math.min(Math.round((elapsedMs / totalMs) * 100), 100) : 100;

    // Progress fill class
    var fillCls = pct >= 100 ? "complete" : pct >= 75 ? "warn" : "";

    // Status badge
    var statusMap = {
        "on-track": '<span class="sg-badge on-track"><i class="fa-solid fa-circle-check"></i> On Track</span>',
        "behind":   '<span class="sg-badge behind"><i class="fa-solid fa-circle-exclamation"></i> Behind Schedule</span>',
        "critical": '<span class="sg-badge critical"><i class="fa-solid fa-circle-xmark"></i> Critical</span>',
        "achieved": '<span class="sg-badge achieved"><i class="fa-solid fa-trophy"></i> Achieved 🎉</span>'
    };

    var priorityMap = {
        "High":   '<span class="sg-badge high">🔴 High Priority</span>',
        "Medium": '<span class="sg-badge medium">🟡 Medium Priority</span>',
        "Low":    '<span class="sg-badge low">🟢 Low Priority</span>'
    };

    // Order buttons (only for active goals)
    var orderBtns = "";
    if (!isAchievedCard) {
        orderBtns =
            '<div class="sg-card-order-btns">' +
                '<button class="sg-order-btn" title="Move up" onclick="moveGoal(\'' + goal.id + '\', -1)"' +
                    (activeIdx === 0 ? " disabled" : "") + '>' +
                    '<i class="fa-solid fa-chevron-up"></i>' +
                '</button>' +
                '<button class="sg-order-btn" title="Move down" onclick="moveGoal(\'' + goal.id + '\', 1)"' +
                    (activeIdx === totalActive - 1 ? " disabled" : "") + '>' +
                    '<i class="fa-solid fa-chevron-down"></i>' +
                '</button>' +
            '</div>';
    }

    // Last 3 contributions
    var contribs    = goal.contributions || [];
    var last3       = contribs.slice(-3).reverse();
    var contribHTML = "";

    if (last3.length > 0) {
        contribHTML =
            '<div class="sg-recent-contribs">' +
                '<div class="sg-recent-title">Recent Contributions</div>';
        last3.forEach(function (c) {
            contribHTML +=
                '<div class="sg-contrib-item">' +
                    '<div class="sg-contrib-dot"></div>' +
                    '<span class="sg-contrib-note">' + (c.note || "Contribution") + '</span>' +
                    '<span class="sg-contrib-date">' + fmtDate(c.date) + '</span>' +
                    '<span class="sg-contrib-amt">+ ' + fmtINR(c.amount) + '</span>' +
                '</div>';
        });
        if (contribs.length > 3) {
            contribHTML +=
                '<button class="sg-view-all-link" onclick="openHistoryModal(\'' + goal.id + '\')">' +
                    'View all ' + contribs.length + ' contributions' +
                '</button>';
        }
        contribHTML += '</div>';
    }

    // Achieved overlay
    var achievedHTML = "";
    if (isAchievedCard) {
        achievedHTML =
            '<div class="sg-achieved-badge-big">' +
                '<i class="fa-solid fa-trophy" style="color:#28a745;font-size:18px;"></i>' +
                ' 🎉 Goal Achieved! You saved ' + fmtINR(saved) + ' — target was ' + fmtINR(target) +
            '</div>';
    }

    // Action buttons
    var actionBtns = "";
    if (!isAchievedCard) {
        actionBtns =
            '<div class="sg-card-actions">' +
                '<button class="sg-card-btn sg-btn-primary" onclick="openContribModal(\'' + goal.id + '\')">' +
                    '<i class="fa-solid fa-plus"></i> Add Money' +
                '</button>' +
                '<button class="sg-card-btn sg-btn-outline" onclick="openHistoryModal(\'' + goal.id + '\')">' +
                    '<i class="fa-solid fa-clock-rotate-left"></i> History' +
                '</button>' +
                '<button class="sg-card-btn sg-btn-outline" onclick="openEditModal(\'' + goal.id + '\')">' +
                    '<i class="fa-solid fa-pen"></i> Edit' +
                '</button>' +
                '<button class="sg-card-btn sg-btn-danger" onclick="deleteGoal(\'' + goal.id + '\')">' +
                    '<i class="fa-solid fa-trash-can"></i> Delete' +
                '</button>' +
            '</div>';
    } else {
        actionBtns =
            '<div class="sg-card-actions">' +
                '<button class="sg-card-btn sg-btn-outline" onclick="openHistoryModal(\'' + goal.id + '\')">' +
                    '<i class="fa-solid fa-clock-rotate-left"></i> History' +
                '</button>' +
                '<button class="sg-card-btn sg-btn-danger" onclick="deleteGoal(\'' + goal.id + '\')">' +
                    '<i class="fa-solid fa-trash-can"></i> Delete' +
                '</button>' +
            '</div>';
    }

    card.innerHTML =
        // Top row
        '<div class="sg-card-top">' +
            '<span class="sg-card-emoji">' + (goal.emoji || "🎯") + '</span>' +
            '<div class="sg-card-title-block">' +
                '<div class="sg-card-name">' + goal.goalName + '</div>' +
                '<div class="sg-card-badges">' +
                    (statusMap[status] || "") +
                    (priorityMap[goal.priority || "Medium"] || "") +
                '</div>' +
            '</div>' +
            orderBtns +
        '</div>' +

        // Achieved overlay
        achievedHTML +

        // Stats
        '<div class="sg-card-stats">' +
            '<div class="sg-stat">' +
                '<span class="sg-stat-label">Target</span>' +
                '<span class="sg-stat-value">' + fmtINR(target) + '</span>' +
            '</div>' +
            '<div class="sg-stat">' +
                '<span class="sg-stat-label">Saved</span>' +
                '<span class="sg-stat-value saved-val">' + fmtINR(saved) + '</span>' +
            '</div>' +
            '<div class="sg-stat">' +
                '<span class="sg-stat-label">Remaining</span>' +
                '<span class="sg-stat-value remain-val">' + (isAchievedCard ? "—" : fmtINR(remain)) + '</span>' +
            '</div>' +
            '<div class="sg-stat">' +
                '<span class="sg-stat-label">Save/Month</span>' +
                '<span class="sg-stat-value monthly-val">' + (isAchievedCard ? "—" : fmtINR(monthly)) + '</span>' +
            '</div>' +
        '</div>' +

        // Progress bar
        '<div class="sg-card-progress">' +
            '<div class="sg-progress-header">' +
                '<span class="sg-progress-label">Progress</span>' +
                '<span class="sg-progress-pct">' + pct + '% completed</span>' +
            '</div>' +
            '<div class="sg-progress-bar">' +
                '<div class="sg-progress-fill ' + fillCls + '" style="width:' + pct + '%"></div>' +
            '</div>' +
            // Expected vs actual indicator (only for active goals)
            (!isAchievedCard && expectedPct > 0 ?
                '<div class="sg-expected-row">' +
                    '<span>Actual: ' + pct + '%</span>' +
                    '<div class="sg-expected-marker">' +
                        '<div class="sg-expected-line" style="left:' + Math.min(expectedPct, 100) + '%"></div>' +
                    '</div>' +
                    '<span class="sg-expected-label">Expected: ' + expectedPct + '%</span>' +
                '</div>'
            : '') +
        '</div>' +

        // Meta: deadline + suggestion
        '<div class="sg-card-meta">' +
            '<span class="sg-meta-item' + (timeInfo.overdue ? " overdue" : "") + '">' +
                '<i class="fa-solid fa-calendar-days"></i>' +
                ' Deadline: ' + fmtDate(goal.deadline) +
            '</span>' +
            '<span class="sg-meta-item' + (timeInfo.overdue ? " overdue" : "") + '">' +
                '<i class="fa-solid fa-clock"></i>' +
                ' ' + timeInfo.text +
            '</span>' +
        '</div>' +

        // Monthly suggestion
        (!isAchievedCard && mLeft > 0 ?
            '<div class="sg-suggestion-box">' +
                '<i class="fa-solid fa-lightbulb"></i>' +
                ' Save <strong>' + fmtINR(monthly) + '/month</strong> for the next ' +
                mLeft + ' month' + (mLeft !== 1 ? 's' : '') + ' to reach your goal on time.' +
            '</div>'
        : '') +

        // Recent contributions
        contribHTML +

        // Action buttons
        actionBtns;

    return card;
}


// ================================
// MOVE GOAL (order)
// ================================

function moveGoal(id, direction) {
    var goals  = loadGoals();
    var active = goals.filter(function (g) { return !isAchieved(g); });
    var idx    = active.findIndex(function (g) { return g.id === id; });
    var newIdx = idx + direction;

    if (newIdx < 0 || newIdx >= active.length) return;

    // Swap in the full goals array
    var aPos = goals.findIndex(function (g) { return g.id === active[idx].id; });
    var bPos = goals.findIndex(function (g) { return g.id === active[newIdx].id; });

    var tmp      = goals[aPos];
    goals[aPos]  = goals[bPos];
    goals[bPos]  = tmp;

    saveGoals(goals);
    renderAll();
}


// ================================
// DELETE GOAL
// ================================

function deleteGoal(id) {
    var goals = loadGoals();
    var goal  = goals.find(function (g) { return g.id === id; });
    if (!goal) return;

    openModal({
        icon:         "🗑️",
        title:        "Delete Goal?",
        message:      'Delete <strong>' + (goal.emoji || "🎯") + ' ' + goal.goalName + '</strong>?<br><br>All contribution history will be lost.',
        confirmText:  "Delete",
        confirmClass: "",
        onConfirm: function () {
            var updated = goals.filter(function (g) { return g.id !== id; });
            saveGoals(updated);
            renderAll();
        }
    });
}


// ================================
// CREATE / EDIT GOAL MODAL
// ================================

var editingGoalId = null;
var selectedEmoji = "🎯";
var selectedPriority = "Medium";
var selectedStatus   = "auto";

function buildEmojiPicker() {
    var row = document.getElementById("sgEmojiRow");
    row.innerHTML = "";
    EMOJI_OPTIONS.forEach(function (em) {
        var btn = document.createElement("button");
        btn.type      = "button";
        btn.className = "sg-emoji-opt" + (em === selectedEmoji ? " selected" : "");
        btn.textContent = em;
        btn.addEventListener("click", function () {
            selectedEmoji = em;
            document.querySelectorAll(".sg-emoji-opt").forEach(function (b) {
                b.classList.remove("selected");
            });
            btn.classList.add("selected");
            document.getElementById("sgCustomEmoji").value = "";
        });
        row.appendChild(btn);
    });
}

function openCreateModal() {
    editingGoalId    = null;
    selectedEmoji    = "🎯";
    selectedPriority = "Medium";
    selectedStatus   = "auto";

    document.getElementById("sgModalTitle").textContent = "Create New Goal";
    document.getElementById("sgGoalName").value    = "";
    document.getElementById("sgTargetAmount").value = "";
    document.getElementById("sgStartAmount").value  = "";
    document.getElementById("sgCustomEmoji").value  = "";

    // Default deadline = 6 months from now
    var d = new Date();
    d.setMonth(d.getMonth() + 6);
    document.getElementById("sgDeadline").value = d.toISOString().split("T")[0];

    clearGoalErrors();
    buildEmojiPicker();
    setPriorityActive("Medium");
    setStatusActive("auto");

    document.getElementById("sgGoalModalOverlay").classList.add("active");
    document.getElementById("sgGoalName").focus();
}

function openEditModal(id) {
    var goals = loadGoals();
    var goal  = goals.find(function (g) { return g.id === id; });
    if (!goal) return;

    editingGoalId    = id;
    selectedEmoji    = goal.emoji    || "🎯";
    selectedPriority = goal.priority || "Medium";
    selectedStatus   = goal.statusOverride || "auto";

    document.getElementById("sgModalTitle").textContent  = "Edit Goal";
    document.getElementById("sgGoalName").value          = goal.goalName;
    document.getElementById("sgTargetAmount").value      = goal.targetAmount;
    document.getElementById("sgStartAmount").value       = "";
    document.getElementById("sgDeadline").value          = goal.deadline;
    document.getElementById("sgCustomEmoji").value       = "";

    clearGoalErrors();
    buildEmojiPicker();
    setPriorityActive(selectedPriority);
    setStatusActive(selectedStatus);

    document.getElementById("sgGoalModalOverlay").classList.add("active");
    document.getElementById("sgGoalName").focus();
}

function closeGoalModal() {
    document.getElementById("sgGoalModalOverlay").classList.remove("active");
    editingGoalId = null;
}

function setPriorityActive(val) {
    selectedPriority = val;
    document.querySelectorAll(".sg-priority-btn").forEach(function (btn) {
        btn.classList.toggle("active", btn.dataset.priority === val);
    });
}

function setStatusActive(val) {
    selectedStatus = val;
    document.querySelectorAll(".sg-status-btn").forEach(function (btn) {
        btn.classList.toggle("active", btn.dataset.status === val);
    });
}

function clearGoalErrors() {
    ["sgNameError","sgTargetError","sgDeadlineError"].forEach(function (id) {
        document.getElementById(id).classList.remove("visible");
    });
    ["sgGoalName","sgTargetAmount","sgDeadline"].forEach(function (id) {
        document.getElementById(id).classList.remove("invalid");
    });
}

function saveGoalModal() {
    var name     = document.getElementById("sgGoalName").value.trim();
    var target   = parseFloat(document.getElementById("sgTargetAmount").value);
    var startAmt = parseFloat(document.getElementById("sgStartAmount").value) || 0;
    var deadline = document.getElementById("sgDeadline").value;
    var custom   = document.getElementById("sgCustomEmoji").value.trim();
    var emoji    = custom || selectedEmoji;

    clearGoalErrors();
    var valid = true;

    if (!name) {
        document.getElementById("sgNameError").classList.add("visible");
        document.getElementById("sgGoalName").classList.add("invalid");
        valid = false;
    }
    if (isNaN(target) || target <= 0) {
        document.getElementById("sgTargetError").classList.add("visible");
        document.getElementById("sgTargetAmount").classList.add("invalid");
        valid = false;
    }
    if (!deadline) {
        document.getElementById("sgDeadlineError").classList.add("visible");
        document.getElementById("sgDeadline").classList.add("invalid");
        valid = false;
    }
    if (!valid) return;

    var goals = loadGoals();

    if (editingGoalId) {
        // Edit existing
        goals = goals.map(function (g) {
            if (g.id !== editingGoalId) return g;
            return Object.assign({}, g, {
                goalName:       name,
                targetAmount:   target,
                deadline:       deadline,
                emoji:          emoji,
                priority:       selectedPriority,
                statusOverride: selectedStatus
            });
        });
    } else {
        // Create new
        var contribs = [];
        if (startAmt > 0) {
            contribs.push({
                id:     Date.now(),
                amount: startAmt,
                date:   new Date().toISOString().split("T")[0],
                note:   "Starting amount"
            });
        }
        var newGoal = {
            id:             String(Date.now()),
            goalName:       name,
            targetAmount:   target,
            savedAmount:    startAmt,
            deadline:       deadline,
            emoji:          emoji,
            priority:       selectedPriority,
            statusOverride: selectedStatus,
            createdAt:      new Date().toISOString().split("T")[0],
            contributions:  contribs
        };
        goals.push(newGoal);
    }

    saveGoals(goals);
    closeGoalModal();
    renderAll();
}


// ================================
// CONTRIBUTION MODAL
// ================================

var contribGoalId = null;

function openContribModal(id) {
    contribGoalId = id;
    var goals = loadGoals();
    var goal  = goals.find(function (g) { return g.id === id; });
    if (!goal) return;

    document.getElementById("sgContribTitle").textContent = "Add to: " + goal.goalName;
    document.getElementById("sgContribGoalInfo").innerHTML =
        '<span style="font-size:22px;margin-right:8px;">' + (goal.emoji || "🎯") + '</span>' +
        '<span>' + fmtINR(goal.savedAmount) + ' saved of ' + fmtINR(goal.targetAmount) + '</span>';

    document.getElementById("sgContribAmount").value = "";
    document.getElementById("sgContribDate").value   = new Date().toISOString().split("T")[0];
    document.getElementById("sgContribNote").value   = "";
    document.getElementById("sgContribError").classList.remove("visible");
    document.getElementById("sgContribAmount").classList.remove("invalid");

    document.getElementById("sgContribModalOverlay").classList.add("active");
    document.getElementById("sgContribAmount").focus();
}

function closeContribModal() {
    document.getElementById("sgContribModalOverlay").classList.remove("active");
    contribGoalId = null;
}

function saveContribution() {
    var amount = parseFloat(document.getElementById("sgContribAmount").value);
    var date   = document.getElementById("sgContribDate").value;
    var note   = document.getElementById("sgContribNote").value.trim();

    document.getElementById("sgContribError").classList.remove("visible");

    if (isNaN(amount) || amount <= 0) {
        document.getElementById("sgContribError").classList.add("visible");
        document.getElementById("sgContribAmount").classList.add("invalid");
        return;
    }

    var goals = loadGoals();
    goals = goals.map(function (g) {
        if (g.id !== contribGoalId) return g;
        var contribs = g.contributions || [];
        contribs.push({
            id:     Date.now(),
            amount: amount,
            date:   date || new Date().toISOString().split("T")[0],
            note:   note || "Contribution"
        });
        return Object.assign({}, g, {
            savedAmount:   g.savedAmount + amount,
            contributions: contribs
        });
    });

    saveGoals(goals);
    closeContribModal();
    renderAll();
}


// ================================
// HISTORY MODAL
// ================================

function openHistoryModal(id) {
    var goals = loadGoals();
    var goal  = goals.find(function (g) { return g.id === id; });
    if (!goal) return;

    document.getElementById("sgHistoryTitle").textContent =
        (goal.emoji || "🎯") + " " + goal.goalName + " — Contributions";

    var contribs  = (goal.contributions || []).slice().reverse();
    var listEl    = document.getElementById("sgHistoryList");
    var emptyEl   = document.getElementById("sgHistoryEmpty");

    listEl.innerHTML = "";

    if (contribs.length === 0) {
        listEl.style.display   = "none";
        emptyEl.classList.add("visible");
    } else {
        listEl.style.display   = "";
        emptyEl.classList.remove("visible");
        contribs.forEach(function (c) {
            var item = document.createElement("div");
            item.className = "sg-history-item";
            item.innerHTML =
                '<div class="sg-history-dot"></div>' +
                '<div class="sg-history-info">' +
                    '<div class="sg-history-note">' + (c.note || "Contribution") + '</div>' +
                    '<div class="sg-history-date">' + fmtDate(c.date) + '</div>' +
                '</div>' +
                '<div class="sg-history-amt">+ ' + fmtINR(c.amount) + '</div>';
            listEl.appendChild(item);
        });
    }

    document.getElementById("sgHistoryModalOverlay").classList.add("active");
}

function closeHistoryModal() {
    document.getElementById("sgHistoryModalOverlay").classList.remove("active");
}


// ================================
// ACHIEVED SECTION TOGGLE
// ================================

document.getElementById("sgAchievedToggle").addEventListener("click", function () {
    var list    = document.getElementById("sgAchievedList");
    var chevron = document.getElementById("sgAchievedChevron");
    list.classList.toggle("open");
    chevron.classList.toggle("open");
});


// ================================
// EVENT LISTENERS
// ================================

// Add goal buttons
document.getElementById("sgAddGoalBtn").addEventListener("click", openCreateModal);
document.getElementById("sgEmptyAddBtn").addEventListener("click", openCreateModal);

// Goal modal
document.getElementById("sgModalClose").addEventListener("click",  closeGoalModal);
document.getElementById("sgModalCancel").addEventListener("click", closeGoalModal);
document.getElementById("sgModalSave").addEventListener("click",   saveGoalModal);

document.getElementById("sgGoalModalOverlay").addEventListener("click", function (e) {
    if (e.target === this) closeGoalModal();
});

// Priority buttons
document.getElementById("sgPriorityRow").addEventListener("click", function (e) {
    var btn = e.target.closest(".sg-priority-btn");
    if (btn) setPriorityActive(btn.dataset.priority);
});

// Status buttons
document.getElementById("sgStatusRow").addEventListener("click", function (e) {
    var btn = e.target.closest(".sg-status-btn");
    if (btn) setStatusActive(btn.dataset.status);
});

// Contribution modal
document.getElementById("sgContribClose").addEventListener("click",  closeContribModal);
document.getElementById("sgContribCancel").addEventListener("click", closeContribModal);
document.getElementById("sgContribSave").addEventListener("click",   saveContribution);

document.getElementById("sgContribModalOverlay").addEventListener("click", function (e) {
    if (e.target === this) closeContribModal();
});

document.getElementById("sgContribAmount").addEventListener("keydown", function (e) {
    if (e.key === "Enter") saveContribution();
});

// History modal
document.getElementById("sgHistoryClose").addEventListener("click",  closeHistoryModal);
document.getElementById("sgHistoryClose2").addEventListener("click", closeHistoryModal);

document.getElementById("sgHistoryModalOverlay").addEventListener("click", function (e) {
    if (e.target === this) closeHistoryModal();
});

// Enter key on goal form
document.getElementById("sgGoalName").addEventListener("keydown", function (e) {
    if (e.key === "Enter") saveGoalModal();
});

// Escape closes any open modal
document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeGoalModal();
    closeContribModal();
    closeHistoryModal();
});


// ================================
// INIT
// ================================

renderAll();