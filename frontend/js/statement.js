// ================================
// SOA STATEMENT PAGE — statement.js
// Features: period selection, presets,
// statement generation, running balance,
// PDF download via jsPDF, print
// ================================


// ================================
// LOCALSTORAGE KEYS
// ================================

const KEY_TRANSACTIONS = "finantra_transactions";
const KEY_PREFS        = "finantra_preferences";
const KEY_PROFILE      = "finantra_user_profile";
const KEY_USER_ID      = "finantra_user_id";


// ================================
// DATE HELPERS
// ================================

function getTodayStr() {
    return new Date().toISOString().split("T")[0];
}

function formatDisplay(dateStr) {
    if (!dateStr) return "—";
    const [year, month, day] = dateStr.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"];
    return parseInt(day) + " " + months[parseInt(month) - 1] + " " + year;
}

function formatINR_PDF(amount) {
    return "₹ " + Math.abs(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatINR_PDF(amount) {
    return "Rs. " + Math.abs(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ================================
// BUILD CATEGORY SUMMARY DATA
// ================================

function buildCategoryData(transactions) {
    const expenses = transactions.filter(function (t) {
        return t.type === "Expense";
    });

    const catMap   = {};
    const emojiMap = {};
    const countMap = {};

    expenses.forEach(function (t) {
        const cat = t.category;
        catMap[cat]   = (catMap[cat]   || 0) + parseFloat(t.amount);
        emojiMap[cat] = t.emoji || "💰";
        countMap[cat] = (countMap[cat] || 0) + 1;
    });

    const total = Object.values(catMap).reduce(function (a, b) {
        return a + b;
    }, 0);

    const sorted = Object.entries(catMap)
        .sort(function (a, b) { return b[1] - a[1]; });

    return { sorted, emojiMap, countMap, total };
}

// ================================
// RENDER CATEGORY SUMMARY ON SCREEN
// ================================

function renderCategorySummary(transactions) {
    const list      = document.getElementById("catSummaryList");
    const totalEl   = document.getElementById("catTotalExpense");
    const container = document.getElementById("docCategorySummary");

    if (!list) return;

    list.innerHTML = "";

    const { sorted, emojiMap, countMap, total } = buildCategoryData(transactions);

    if (sorted.length === 0) {
        container.style.display = "none";
        return;
    }

    container.style.display = "block";
    totalEl.textContent = formatINR_PDF(total);

    const barColors = [
        "#1f82a6","#28a745","#dc3545","#f0a500",
        "#6f42c1","#fd7e14","#20c997","#e83e8c"
    ];

    sorted.forEach(function (entry, index) {
        const [name, amount] = entry;
        const pct   = total > 0 ? Math.round((amount / total) * 100) : 0;
        const count = countMap[name];
        const emoji = emojiMap[name];
        const color = barColors[index % barColors.length];

        const div = document.createElement("div");
        div.classList.add("cat-row");
        div.innerHTML = `
            <span class="cat-row-emoji">${emoji}</span>
            <span class="cat-row-name">${name}</span>
            <span class="cat-row-count">${count} txn${count > 1 ? "s" : ""}</span>
            <div class="cat-row-bar-wrap">
                <div class="cat-row-bar-fill"
                     style="width:${pct}%; background:${color}"></div>
            </div>
            <span class="cat-row-amount">${formatINR_PDF(amount)}</span>
            <span class="cat-row-pct">${pct}%</span>
        `;
        list.appendChild(div);
    });
}
// ================================
// PERIOD PRESETS
// ================================

function setPreset(preset, btn) {
    // Update active pill
    document.querySelectorAll(".preset-pill").forEach(function (p) {
        p.classList.remove("active");
    });
    btn.classList.add("active");

    const today = getTodayStr();
    const now   = new Date();
    let from, to;

    if (preset === "month") {
        from = now.getFullYear() + "-" +
               String(now.getMonth() + 1).padStart(2, "0") + "-01";
        to   = today;
    }

    else if (preset === "lastmonth") {
        const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        from = last.toISOString().split("T")[0];
        to   = lastEnd.toISOString().split("T")[0];
    }

    else if (preset === "3months") {
        const d = new Date();
        d.setMonth(d.getMonth() - 3);
        from = d.toISOString().split("T")[0];
        to   = today;
    }

    else if (preset === "year") {
        from = now.getFullYear() + "-01-01";
        to   = today;
    }

    else if (preset === "custom") {
        // Just let user pick manually
        document.getElementById("fromDate").focus();
        return;
    }

    document.getElementById("fromDate").value = from;
    document.getElementById("toDate").value   = to;
}


// ================================
// GENERATE STATEMENT
// ================================

function generateStatement() {
    const fromDate  = document.getElementById("fromDate").value;
    const toDate    = document.getElementById("toDate").value;
    const typeFilter = document.getElementById("typeFilter").value;

    // Validate dates
    if (!fromDate || !toDate) {
        openModal({
            icon:         "📅",
            title:        "Select Date Range",
            message:      "Please select both a <strong>From</strong> and <strong>To</strong> date before generating the statement.",
            confirmText:  "OK",
            confirmClass: "primary",
            onConfirm:    function () {}
        });
        return;
    }

    if (fromDate > toDate) {
        openModal({
            icon:         "⚠️",
            title:        "Invalid Date Range",
            message:      "<strong>From</strong> date cannot be after <strong>To</strong> date.",
            confirmText:  "OK",
            confirmClass: "primary",
            onConfirm:    function () {}
        });
        return;
    }

    // Get all transactions
    const all = JSON.parse(localStorage.getItem(KEY_TRANSACTIONS)) || [];

    // Filter by date range + type
    let filtered = all.filter(function (t) {
        const inRange = t.date >= fromDate && t.date <= toDate;
        const inType  = typeFilter === "all" || t.type === typeFilter;
        return inRange && inType;
    });

    // Sort by date ascending (oldest first for running balance)
    filtered.sort(function (a, b) {
        return a.date.localeCompare(b.date) || a.id - b.id;
    });

    // Get user info
    const profile = JSON.parse(localStorage.getItem(KEY_PROFILE)) || {};
    const prefs   = JSON.parse(localStorage.getItem(KEY_PREFS))   || {};
    const userId  = localStorage.getItem(KEY_USER_ID) || "FT-XXXX";

    const startingBalance = parseFloat(prefs.startingBalance) || 0;

    // Calculate opening balance
    // = starting balance + all transactions BEFORE fromDate
    const allBeforeFrom = all.filter(function (t) {
        return t.date < fromDate;
    });

    let openingBalance = startingBalance;
    allBeforeFrom.forEach(function (t) {
        openingBalance += t.type === "Income"
            ? parseFloat(t.amount)
            : -parseFloat(t.amount);
    });

    // Calculate totals
    let totalCredits = 0;
    let totalDebits  = 0;

    filtered.forEach(function (t) {
        if (t.type === "Income") totalCredits += parseFloat(t.amount);
        else                     totalDebits  += parseFloat(t.amount);
    });

    const closingBalance = openingBalance + totalCredits - totalDebits;
    const net            = totalCredits - totalDebits;

    // Populate document header
    document.getElementById("docUserId").textContent   = userId;
    document.getElementById("docUserName").textContent = profile.name || "FinanTra User";
    document.getElementById("docPeriod").textContent   =
        formatDisplay(fromDate) + " — " + formatDisplay(toDate);
    document.getElementById("docGenDate").textContent  = formatDisplay(getTodayStr());

    // Populate summary strip
    document.getElementById("docOpenBal").textContent  = formatINR_PDF(openingBalance);
    document.getElementById("docCredits").textContent  = formatINR_PDF(totalCredits);
    document.getElementById("docDebits").textContent   = formatINR_PDF(totalDebits);
    document.getElementById("docCloseBal").textContent = formatINR_PDF(closingBalance);

    // Closing balance color
    const closeEl = document.getElementById("docCloseBal");
    closeEl.style.color = closingBalance >= 0 ? "#1f82a6" : "#dc3545";

    // Populate footer
    document.getElementById("footerCredits").textContent = formatINR_PDF(totalCredits);
    document.getElementById("footerDebits").textContent  = formatINR_PDF(totalDebits);

    const netEl = document.getElementById("footerNet");
    netEl.textContent = (net >= 0 ? "+ " : "- ") + formatINR_PDF(net);
    netEl.style.color = net >= 0 ? "#28a745" : "#dc3545";

    const footerCloseEl = document.getElementById("footerClose");
    footerCloseEl.textContent = formatINR_PDF(closingBalance);
    footerCloseEl.style.color = closingBalance >= 0 ? "#1f82a6" : "#dc3545";

    // Populate transaction table
    renderTable(filtered, openingBalance);
    renderCategorySummary(filtered);

    // Show statement preview
    const preview = document.getElementById("statementPreview");
    preview.classList.add("visible");
    preview.scrollIntoView({ behavior: "smooth", block: "start" });

    // Store data for PDF generation
    window._soaData = {
        fromDate, toDate, userId,
        userName:       profile.name || "FinanTra User",
        openingBalance, totalCredits, totalDebits,
        closingBalance, net, filtered
    };
}


// ================================
// RENDER TRANSACTION TABLE
// ================================

function renderTable(transactions, openingBalance) {
    const tbody   = document.getElementById("docTableBody");
    const emptyEl = document.getElementById("docEmpty");
    const table   = document.getElementById("docTable");

    tbody.innerHTML = "";

    if (transactions.length === 0) {
        table.style.display   = "none";
        emptyEl.classList.add("visible");
        return;
    }

    table.style.display = "";
    emptyEl.classList.remove("visible");

    let runningBalance = openingBalance;

    transactions.forEach(function (t) {
        const isIncome = t.type === "Income";
        const amount   = parseFloat(t.amount);
        const notes    = t.notes || "—";

        if (isIncome) runningBalance += amount;
        else          runningBalance -= amount;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formatDisplay(t.date)}</td>
            <td>${notes}</td>
            <td>${t.emoji || ""} ${t.category}</td>
            <td>${t.payment}</td>
            <td class="${isIncome ? "row-credit" : "dash-cell"}">
                ${isIncome ? formatINR_PDF(amount) : "—"}
            </td>
            <td class="${!isIncome ? "row-debit" : "dash-cell"}">
                ${!isIncome ? formatINR_PDF(amount) : "—"}
            </td>
            <td class="row-bal" style="color:${runningBalance >= 0 ? "#1f82a6" : "#dc3545"}">
                ${formatINR_PDF(runningBalance)}
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// ================================
// DOWNLOAD PDF (jsPDF + autoTable)
// ================================

function downloadPDF() {
    const data = window._soaData;
    if (!data) {
        alert("Please generate the statement first.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc       = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageW = doc.internal.pageSize.getWidth();
    let y       = 20;

    // ── HEADER ──
doc.setFillColor(31, 130, 166);
doc.rect(0, 0, pageW, 38, "F");

// Logo — convert from img element to base64 via canvas
try {
    const logoImg  = document.querySelector(".doc-logo");
    const canvas   = document.createElement("canvas");
    canvas.width   = 54;
    canvas.height  = 54;
    const ctx      = canvas.getContext("2d");

    // Clip to circle before drawing
    ctx.beginPath();
    ctx.arc(27, 27, 27, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(logoImg, 0, 0, 54, 54);
    const logoData = canvas.toDataURL("image/png");
    doc.addImage(logoData, "PNG", 10, 6, 14, 14);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("FinanTra", 27, 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Personal Finance Tracker", 27, 22);
} catch (e) {
    // Fallback if logo fails
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("FinanTra", 14, 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Personal Finance Tracker", 14, 22);
}

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Statement of Account", pageW - 14, 14, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Account ID: " + data.userId,            pageW - 14, 20, { align: "right" });
    doc.text("Name: " + data.userName,                pageW - 14, 25, { align: "right" });
    doc.text("Period: " + formatDisplay(data.fromDate) + " — " + formatDisplay(data.toDate),
        pageW - 14, 30, { align: "right" });
    doc.text("Generated: " + formatDisplay(getTodayStr()), pageW - 14, 35, { align: "right" });

    y = 48;

    // ── SUMMARY STRIP ──
    doc.setFillColor(240, 248, 251);
    doc.rect(10, y, pageW - 20, 22, "F");

    doc.setTextColor(136, 136, 136);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");

    const colW   = (pageW - 20) / 4;
    const labels = ["Opening Balance", "Total Credits", "Total Debits", "Closing Balance"];
    const values = [
        formatINR_PDF(data.openingBalance),
        formatINR_PDF(data.totalCredits),
        formatINR_PDF(data.totalDebits),
        formatINR_PDF(data.closingBalance)
    ];
    const colors = [
        [34,  34,  34],
        [40,  167, 69],
        [220, 53,  69],
        [31,  130, 166]
    ];

    labels.forEach(function (label, i) {
        const x = 14 + i * colW;
        doc.setTextColor(136, 136, 136);
        doc.text(label.toUpperCase(), x, y + 8);
        doc.setTextColor(colors[i][0], colors[i][1], colors[i][2]);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(values[i], x, y + 16);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
    });

    y += 30;

// ── CATEGORY SUMMARY IN PDF ──
const { sorted, emojiMap, countMap, total } = buildCategoryData(data.filtered);

if (sorted.length > 0) {
    doc.setTextColor(31, 130, 166);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("CATEGORY-WISE SPENDING SUMMARY", 14, y);
    y += 6;

    const catRows = sorted.map(function (entry) {
        const [name, amount] = entry;
        const pct   = total > 0 ? Math.round((amount / total) * 100) : 0;
        const count = countMap[name];
        return [name, count + " txn" + (count > 1 ? "s" : ""), formatINR_PDF(amount), pct + "%"];
    });

    doc.autoTable({
        startY:  y,
        head:    [["Category", "Transactions", "Amount", "% of Total"]],
        body:    catRows,
        theme:   "striped",
        headStyles: {
            fillColor: [31, 130, 166],
            textColor: 255,
            fontStyle: "bold",
            fontSize:  8
        },
        bodyStyles: {
            fontSize:  8,
            textColor: [50, 50, 50]
        },
        alternateRowStyles: { fillColor: [245, 251, 253] },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 35, halign: "center" },
            2: { cellWidth: 50, textColor: [220, 53, 69], fontStyle: "bold" },
            3: { cellWidth: 35, halign: "center", textColor: [100, 100, 100] }
        },
        foot: [["Total Expense", "", formatINR_PDF(total), "100%"]],
        footStyles: {
            fillColor: [240, 248, 251],
            textColor: [31, 130, 166],
            fontStyle: "bold",
            fontSize:  8
        },
        margin: { left: 10, right: 10 }
    });

    y = doc.lastAutoTable.finalY + 10;
}


    // ── TRANSACTION TABLE ──
    if (data.filtered.length === 0) {
        doc.setTextColor(170, 170, 170);
        doc.setFontSize(11);
        doc.text("No transactions found for this period.", pageW / 2, y + 20, { align: "center" });
    } else {
        let runBal = data.openingBalance;
        const rows = data.filtered.map(function (t) {
            const isIncome = t.type === "Income";
            const amount   = parseFloat(t.amount);
            if (isIncome) runBal += amount;
            else          runBal -= amount;

            return [
                formatDisplay(t.date),
                t.notes || "—",
                t.category,
                t.payment,
                isIncome ? formatINR_PDF(amount) : "—",
                !isIncome ? formatINR_PDF(amount) : "—",
                formatINR_PDF(runBal)
            ];
        });

        doc.autoTable({
            startY:  y,
            head:    [["Date","Description","Category","Payment","Credit","Debit","Balance"]],
            body:    rows,
            theme:   "striped",
            headStyles: {
                fillColor:  [31, 130, 166],
                textColor:  255,
                fontStyle:  "bold",
                fontSize:   8
            },
            bodyStyles: {
                fontSize:   8,
                textColor:  [50, 50, 50]
            },
            alternateRowStyles: {
                fillColor: [245, 251, 253]
            },
            columnStyles: {
                0: { cellWidth: 22 },
                1: { cellWidth: 38 },
                2: { cellWidth: 30 },
                3: { cellWidth: 22 },
                4: { cellWidth: 24, textColor: [40,167,69],  fontStyle: "bold" },
                5: { cellWidth: 24, textColor: [220,53,69],  fontStyle: "bold" },
                6: { cellWidth: 26, textColor: [31,130,166], fontStyle: "bold" }
            },
            margin: { left: 10, right: 10 }
        });

        y = doc.lastAutoTable.finalY + 10;
    }

    // ── FOOTER ──
    const fY = y + 6;
    doc.setFillColor(250, 252, 253);
    doc.rect(10, fY, pageW - 20, 24, "F");
    doc.setDrawColor(220, 230, 235);
    doc.rect(10, fY, pageW - 20, 24, "S");

    const fColW   = (pageW - 20) / 4;
    const fLabels = ["Total Credits","Total Debits","Net Change","Closing Balance"];
    const net     = data.totalCredits - data.totalDebits;
    const fValues = [
        formatINR_PDF(data.totalCredits),
        formatINR_PDF(data.totalDebits),
        (net >= 0 ? "+ " : "- ") + formatINR_PDF(net),
        formatINR_PDF(data.closingBalance)
    ];
    const fColors = [
        [40,167,69], [220,53,69],
        net >= 0 ? [40,167,69] : [220,53,69],
        [31,130,166]
    ];

    fLabels.forEach(function (label, i) {
        const x = 14 + i * fColW;
        doc.setTextColor(136, 136, 136);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(label.toUpperCase(), x, fY + 8);
        doc.setTextColor(fColors[i][0], fColors[i][1], fColors[i][2]);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(fValues[i], x, fY + 18);
    });

    // Disclaimer
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text(
        "This statement is generated by FinanTra for personal reference only.",
        pageW / 2,
        fY + 32,
        { align: "center" }
    );

    // Save PDF
    const fileName = "FinanTra_SOA_" + data.fromDate + "_to_" + data.toDate + ".pdf";
    doc.save(fileName);
}


// ================================
// PRINT STATEMENT
// ================================

function printStatement() {
    const data = window._soaData;
    if (!data) {
        alert("Please generate the statement first.");
        return;
    }
    window.print();
}


// ================================
// INIT — Set default period to This Month
// ================================

(function init() {
    // Trigger "This Month" preset on load
    const firstPill = document.querySelector(".preset-pill");
    if (firstPill) setPreset("month", firstPill);
})();