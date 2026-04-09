// ================================
// CURRENCY CONVERTER — JS
// FinanTra | Assignment 7
// API: ExchangeRate-API v6
// ================================

const API_KEY  = "453b674d2b027f6896fa52ac";
const API_BASE = "https://v6.exchangerate-api.com/v6/" + API_KEY + "/latest/";


// ================================
// CURRENCY LIST
// code, flag emoji, display name
// ================================

const CURRENCIES = [
    { code: "AED", flag: "🇦🇪", name: "UAE Dirham" },
    { code: "AUD", flag: "🇦🇺", name: "Australian Dollar" },
    { code: "BDT", flag: "🇧🇩", name: "Bangladeshi Taka" },
    { code: "BRL", flag: "🇧🇷", name: "Brazilian Real" },
    { code: "CAD", flag: "🇨🇦", name: "Canadian Dollar" },
    { code: "CHF", flag: "🇨🇭", name: "Swiss Franc" },
    { code: "CNY", flag: "🇨🇳", name: "Chinese Yuan" },
    { code: "DKK", flag: "🇩🇰", name: "Danish Krone" },
    { code: "EUR", flag: "🇪🇺", name: "Euro" },
    { code: "GBP", flag: "🇬🇧", name: "British Pound" },
    { code: "HKD", flag: "🇭🇰", name: "Hong Kong Dollar" },
    { code: "IDR", flag: "🇮🇩", name: "Indonesian Rupiah" },
    { code: "INR", flag: "🇮🇳", name: "Indian Rupee" },
    { code: "JPY", flag: "🇯🇵", name: "Japanese Yen" },
    { code: "KRW", flag: "🇰🇷", name: "South Korean Won" },
    { code: "MXN", flag: "🇲🇽", name: "Mexican Peso" },
    { code: "MYR", flag: "🇲🇾", name: "Malaysian Ringgit" },
    { code: "NOK", flag: "🇳🇴", name: "Norwegian Krone" },
    { code: "NZD", flag: "🇳🇿", name: "New Zealand Dollar" },
    { code: "PHP", flag: "🇵🇭", name: "Philippine Peso" },
    { code: "PKR", flag: "🇵🇰", name: "Pakistani Rupee" },
    { code: "PLN", flag: "🇵🇱", name: "Polish Zloty" },
    { code: "RUB", flag: "🇷🇺", name: "Russian Ruble" },
    { code: "SAR", flag: "🇸🇦", name: "Saudi Riyal" },
    { code: "SEK", flag: "🇸🇪", name: "Swedish Krona" },
    { code: "SGD", flag: "🇸🇬", name: "Singapore Dollar" },
    { code: "THB", flag: "🇹🇭", name: "Thai Baht" },
    { code: "TRY", flag: "🇹🇷", name: "Turkish Lira" },
    { code: "USD", flag: "🇺🇸", name: "US Dollar" },
    { code: "ZAR", flag: "🇿🇦", name: "South African Rand" }
];


// ================================
// POPULAR PAIRS
// Shown as quick-pick cards
// ================================

const QUICK_PAIRS = [
    { from: "USD", to: "INR" },
    { from: "EUR", to: "INR" },
    { from: "GBP", to: "INR" },
    { from: "AED", to: "INR" },
    { from: "USD", to: "EUR" },
    { from: "USD", to: "GBP" }
];


// ================================
// DOM REFERENCES
// ================================

const amountInput  = document.getElementById("ccAmount");
const fromSelect   = document.getElementById("ccFrom");
const toSelect     = document.getElementById("ccTo");
const swapBtn      = document.getElementById("ccSwapBtn");
const convertBtn   = document.getElementById("ccConvertBtn");
const quickGrid    = document.getElementById("ccQuickGrid");

const resultBanner = document.getElementById("ccResultBanner");
const resultLabel  = document.getElementById("ccResultLabel");
const resultValue  = document.getElementById("ccResultValue");
const rateLine     = document.getElementById("ccRateLine");
const rateInverse  = document.getElementById("ccRateInverse");
const timestampEl  = document.getElementById("ccTimestamp");

const errorBox     = document.getElementById("ccError");
const errorText    = document.getElementById("ccErrorText");


// ================================
// HELPER — Get currency object
// ================================

function getCurrency(code) {
    return CURRENCIES.find(function (c) { return c.code === code; });
}


// ================================
// HELPER — Format number for display
// Handles very large, very small,
// and normal values cleanly
// ================================

function formatRate(n) {
    if (n === 0) return "0";
    if (n >= 1000000) return n.toFixed(2);
    if (n < 0.0001)   return n.toFixed(8);
    if (n < 0.01)     return n.toFixed(6);
    if (n < 1)        return n.toFixed(4);
    return n.toLocaleString("en-IN", { maximumFractionDigits: 4 });
}

function formatConverted(n) {
    if (n >= 1000000) return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
    if (n < 0.01)     return n.toFixed(6);
    return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}


// ================================
// SHOW / HIDE ERROR
// ================================

function showError(msg) {
    errorText.textContent = msg;
    errorBox.classList.add("visible");
}

function hideError() {
    errorBox.classList.remove("visible");
}


// ================================
// POPULATE SELECT DROPDOWNS
// Called once on page load
// ================================

function populateSelects() {
    CURRENCIES.forEach(function (c) {
        var optFrom = document.createElement("option");
        optFrom.value       = c.code;
        optFrom.textContent = c.flag + "  " + c.code + " — " + c.name;
        fromSelect.appendChild(optFrom);

        var optTo = document.createElement("option");
        optTo.value       = c.code;
        optTo.textContent = c.flag + "  " + c.code + " — " + c.name;
        toSelect.appendChild(optTo);
    });

    // Defaults: USD → INR
    fromSelect.value = "USD";
    toSelect.value   = "INR";
}


// ================================
// MAIN CONVERT FUNCTION
// Fetches from ExchangeRate-API
// and updates the result banner
// ================================

function doConvert() {
    hideError();

    var amount = parseFloat(amountInput.value);

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
        showError("Please enter a valid amount greater than zero.");
        return;
    }

    var fromCode = fromSelect.value;
    var toCode   = toSelect.value;

    // Set button to loading state
    convertBtn.disabled = true;
    convertBtn.innerHTML =
        '<span class="cc-btn-spinner"></span> Fetching rates…';

    fetch(API_BASE + fromCode)
        .then(function (res) {
            if (!res.ok) {
                throw new Error("Network response was not ok (" + res.status + ")");
            }
            return res.json();
        })
        .then(function (data) {
            if (data.result !== "success") {
                throw new Error(data["error-type"] || "API returned an error");
            }

            var rate      = data.conversion_rates[toCode];
            var converted = amount * rate;
            var inverse   = 1 / rate;

            var fromCur = getCurrency(fromCode);
            var toCur   = getCurrency(toCode);

            // ── Update result banner ──
            resultLabel.textContent = fromCur.flag + " " + amount.toLocaleString("en-IN") + " " + fromCode + "  =";
            resultValue.textContent = toCur.flag + " " + formatConverted(converted) + " " + toCode;
            rateLine.textContent    = "1 " + fromCode + " = " + formatRate(rate) + " " + toCode;
            rateInverse.textContent = "1 " + toCode + " = " + formatRate(inverse) + " " + fromCode;

            // ── Timestamp ──
            var updatedDate = new Date(data.time_last_update_utc);
            timestampEl.innerHTML =
                '<i class="fa-solid fa-clock"></i> Rates as of ' +
                updatedDate.toLocaleString("en-IN", {
                    day:    "numeric",
                    month:  "short",
                    year:   "numeric",
                    hour:   "2-digit",
                    minute: "2-digit"
                });

            // Show banner
            resultBanner.classList.add("visible");

        })
        .catch(function (err) {
            console.error("ExchangeRate-API error:", err);
            showError("Could not fetch rates. Check your internet connection and try again.");
        })
        .finally(function () {
            convertBtn.disabled = false;
            convertBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> <span>Convert</span>';
        });
}


// ================================
// SWAP BUTTON
// Swaps From and To selects
// ================================

swapBtn.addEventListener("click", function () {
    var temp        = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value   = temp;
});


// ================================
// CONVERT BUTTON CLICK
// ================================

convertBtn.addEventListener("click", doConvert);


// ================================
// CONVERT ON ENTER KEY
// ================================

amountInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        doConvert();
    }
});


// ================================
// BUILD QUICK PAIR CARDS
// Fetches live rates for each pair
// and renders clickable cards
// ================================

function buildQuickCards() {
    // Step 1 — Render placeholder cards immediately
    QUICK_PAIRS.forEach(function (pair) {
        var fromCur = getCurrency(pair.from);
        var toCur   = getCurrency(pair.to);

        var card = document.createElement("button");
        card.className          = "cc-quick-card";
        card.dataset.from       = pair.from;
        card.dataset.to         = pair.to;
        card.innerHTML =
            '<div class="cc-qc-flags">' + fromCur.flag + ' → ' + toCur.flag + '</div>' +
            '<div class="cc-qc-pair">' + pair.from + ' → ' + pair.to + '</div>' +
            '<div class="cc-qc-rate loading" id="qcRate_' + pair.from + '_' + pair.to + '">Loading…</div>';

        // Click fills converter and runs
        card.addEventListener("click", function () {
            fromSelect.value  = pair.from;
            toSelect.value    = pair.to;
            amountInput.value = 1;
            doConvert();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        quickGrid.appendChild(card);
    });

    // Step 2 — Fetch rates for unique base currencies needed
    // Quick pairs use USD and AED as bases — fetch both
    var basesNeeded = [];
    QUICK_PAIRS.forEach(function (pair) {
        if (basesNeeded.indexOf(pair.from) === -1) {
            basesNeeded.push(pair.from);
        }
    });

    var fetchPromises = basesNeeded.map(function (base) {
        return fetch(API_BASE + base)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                return { base: base, rates: data.conversion_rates || {} };
            })
            .catch(function () {
                return { base: base, rates: {} };
            });
    });

    Promise.all(fetchPromises).then(function (results) {
        // Build a map: base → rates
        var rateMap = {};
        results.forEach(function (r) {
            rateMap[r.base] = r.rates;
        });

        // Update each card's rate display
        QUICK_PAIRS.forEach(function (pair) {
            var rateEl = document.getElementById("qcRate_" + pair.from + "_" + pair.to);
            if (!rateEl) return;

            var rates = rateMap[pair.from];
            if (rates && rates[pair.to] !== undefined) {
                rateEl.textContent = "1 " + pair.from + " = " + formatRate(rates[pair.to]) + " " + pair.to;
                rateEl.classList.remove("loading");
            } else {
                rateEl.textContent = "Unavailable";
                rateEl.classList.remove("loading");
            }
        });
    });
}


// ================================
// INIT
// ================================

populateSelects();
buildQuickCards();