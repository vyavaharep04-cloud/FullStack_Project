# FinanTra — Project Context File
> Last Updated: 24-03-2026
> Use this file at the start of every new chat to give Claude full project context.
> Just upload this file and say "Here's my project context, let's continue with [task]"

---

## Project Overview
- **Name:** FinanTra — Personal Finance Tracker
- **Type:** Full Stack Web Application (Frontend active, Backend planned)
- **Purpose:** Track income/expenses, visualize spending, manage budgets, improve financial habits
- **College:** S.Y. BTech CSE (AI & ML), PCCoE, Pune

---

## Technology Stack

### Frontend (Active)
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome 6.5.0 (CDN)
- Chart.js (CDN) — dashboard + analytics
- jsPDF 2.5.1 + jsPDF-autotable 3.5.31 (CDN) — SOA PDF generation
- No frameworks — pure HTML/CSS/JS

### Backend (Planned)
- Node.js + Express.js
- MongoDB (database)

### Tools
- VS Code, Git, GitHub, Chrome DevTools, Live Server (port 5500)

---

## Folder Structure

```
FRONTEND/
│
├── landing.html          ✅ Complete
├── login.html            ✅ Complete
├── createAcc.html        ✅ Complete
├── password.html         ✅ Complete
├── dashboard.html        ✅ Complete
├── addTransaction.html   ✅ Complete
├── transactions.html     ✅ Complete
├── analytics.html        ✅ Complete
├── statement.html        ✅ Complete (SOA)
├── profile.html          ✅ Complete
├── blog.html             ✅ Complete
├── faq.html              ✅ Complete
│
├── budgetPlanner.html    🔲 Pending
├── monthlyComparison.html 🔲 Pending
├── financialHealth.html  🔲 Pending
├── currencyConverter.html 🔲 Pending (Assignment 7)
│
├── css/
│   ├── landing.css       ✅ Shared — navbar, footer, hero, sections
│   ├── auth.css          ✅ Login, createAcc, password pages
│   ├── dashboard.css     ✅ Shared — sidebar, layout, cards, dark mode, modal
│   ├── addTransaction.css ✅ Page specific
│   ├── transactions.css  ✅ Page specific
│   ├── analytics.css     ✅ Page specific
│   ├── statement.css     ✅ Page specific + print styles
│   ├── profile.css       ✅ Page specific + profile dark mode
│   ├── blog.css          ✅ Page specific
│   └── faq.css           ✅ Page specific
│
├── js/
│   ├── landing.js        ✅ Navbar toggle, contact form, char counter
│   ├── auth.js           ✅ Login, createAcc, password logic
│   ├── dashboard.js      ✅ Shared — sidebar, charts, modal, theme
│   ├── addTransaction.js ✅ Multi-session, custom categories, localStorage
│   ├── transactions.js   ✅ Filter, search, sort, delete, load more
│   ├── analytics.js      ✅ 6 Chart.js charts, real localStorage data
│   ├── statement.js      ✅ SOA generation, jsPDF, category summary
│   ├── profile.js        ✅ Profile, preferences, dark mode, data mgmt
│   ├── blog.js           ✅ Article expand/collapse
│   └── faq.js            ✅ Accordion, category filter, search
│
└── image/
    ├── FinanTra_logo (2).png
    ├── finantra.svg
    ├── finance-line.svg
    ├── blog1.jpg
    ├── blog2.jpg
    └── blog3.jpg
```

---

## CSS / JS Linking Pattern

### Inner pages (have sidebar):
```html
<link rel="stylesheet" href="css/dashboard.css">   <!-- shared sidebar + modal + dark mode -->
<link rel="stylesheet" href="css/[pageName].css">  <!-- page specific -->
<script src="js/dashboard.js"></script>             <!-- shared sidebar + modal + theme -->
<script src="js/[pageName].js"></script>            <!-- page specific -->
```

### Public pages (landing, blog, faq):
```html
<link rel="stylesheet" href="css/landing.css">     <!-- shared navbar/footer -->
<link rel="stylesheet" href="css/[pageName].css">  <!-- page specific -->
<script src="js/landing.js"></script>               <!-- navbar toggle -->
<script src="js/[pageName].js"></script>            <!-- page specific if needed -->
```

---

## All 10 Assignments Status

| # | Requirement | Implementation | Status |
|---|------------|----------------|--------|
| 1 | Responsive landing page with hero, features, CTA | `landing.html` | ✅ Done |
| 2 | Multi-section portfolio with nav, showcase, contact | `landing.html` | ✅ Done |
| 3 | Blog article page with title, author, image, CSS | `blog.html` | ✅ Done |
| 4 | Collapsible FAQ with JS toggle | `faq.html` + `faq.js` | ✅ Done |
| 5 | Live character counter DOM manipulation | `landing.html` + `addTransaction.html` | ✅ Done |
| 6 | Modal popup — opens on click, closes outside/icon | `dashboard.js` + `dashboard.css` | ✅ Done |
| 7 | Currency converter with real-time API | `currencyConverter.html` | 🔲 Pending |
| 8 | Image grid with category filtering | `blog.html` needs grid + filter | 🔲 Needs update |
| 9 | Dark/light theme toggle with CSS custom properties | `profile.html` + `dashboard.css` | ✅ Done |
| 10 | Responsive project | Entire FinanTra | ✅ Done |

---

## Pages Status

### ✅ Complete

| Page | Key Features |
|------|-------------|
| landing.html | Hero, features, how it works, about, contact + char counter |
| login.html | Glass card UI, finance graph background |
| createAcc.html | Account creation with validation |
| password.html | Forgot password flow |
| dashboard.html | Real localStorage data, Chart.js pie+bar, 3 filters, 5 recent txns |
| addTransaction.html | Multi-session, custom emoji categories, delete custom, localStorage |
| transactions.html | Search, filter, sort, date groups, delete modal, load more |
| analytics.html | 6 charts (expense breakdown, payment split, trend, daily, savings rate, top categories) |
| statement.html | SOA with period presets, category summary, running balance, jsPDF download |
| profile.html | Avatar initials, user ID, financial summary, dark mode toggle, data management |
| blog.html | 4 articles, expand/collapse accordion, full content, SEO |
| faq.html | 12 questions, 4 categories, search, accordion |

### 🔲 Pending

| Page | Description |
|------|-------------|
| currencyConverter.html | Assignment 7 — real-time API |
| budgetPlanner.html | Set monthly category budgets |
| monthlyComparison.html | Compare months side by side |
| financialHealth.html | Financial health score + smart insights |

---

## Key Features Detail

### Dashboard
- Collapsible sidebar (260px ↔ 70px icon-only) on desktop
- Mobile drawer sidebar with hamburger + overlay
- Font Awesome icons on all links
- Filter buttons: Monthly/Weekly/Yearly — reads real localStorage data
- Default filter reads from `finantra_preferences`
- Chart.js doughnut + bar charts — real data from localStorage
- Recent 5 transactions rendered dynamically
- Empty state when no transactions

### Add Transaction
- Income/Expense pill toggle (green/red)
- Custom emoji dropdown — different categories per type
- Delete custom categories with ✕ button (defaults protected)
- Payment pills: Cash, UPI, Card, Bank Transfer
- Notes with 0/150 char counter
- Multi-session: Add to List → Save All
- Session totals + remove individual items
- Balance reads from `startingBalance` preference + real transactions

### Transactions Page
- PhonePe-style grouped by date
- Search + Type filter + Date filter + Sort
- Running group net total per date
- Load More (20 at a time)
- Delete with modal confirmation
- Snackbar after delete

### Analytics Page
- 5 period filters: Last 7 Days (default), This Month, Last 3 Months, This Year, All Time
- All charts read from real localStorage data
- Expense Breakdown doughnut
- Payment Methods doughnut
- Income vs Expense line chart (filled area)
- Daily spending pattern bar (weekends orange)
- Savings rate cumulative line
- Top 6 categories horizontal bars
- Empty states per chart

### SOA Statement
- Period presets: This Month, Last Month, 3 Months, This Year, Custom
- Opening balance = startingBalance + all transactions before start date
- Running balance column per transaction
- Category-wise spending summary (before transaction table)
- jsPDF download with circular logo (200×200 canvas), Rs. formatting
- Print via window.print() with print-specific CSS
- Shared modal for validation errors

### Profile
- Auto-generated User ID: `FT-2026-XXXX` stored in localStorage
- Initials avatar with 26 letter-based colors
- Live avatar update as name typed
- Financial summary from real localStorage data
- Starting balance setting → used in addTransaction + SOA
- Default filter → used in dashboard
- Dark/light theme toggle → applies immediately, saves to preferences
- Clear Transactions + Reset App via modal (two confirms each)

### Dark Mode
- Toggled in profile.html
- Applies immediately on click
- Saved to `finantra_preferences.theme`
- `applySavedTheme()` in `dashboard.js` runs on every inner page load
- Dark mode CSS in `dashboard.css` covers all inner pages
- Profile-specific dark mode in `profile.css`
- Public pages (landing, blog, faq) stay light always

### Shared Modal (Assignment 6)
- `openModal(options)` in `dashboard.js` — reusable everywhere
- Scale-up animation from 85% → 100%
- Closes on overlay click, close icon, or Escape key
- Used in: transactions delete, addTransaction clear session, profile clear/reset

---

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `isLoggedIn` | "true" when logged in |
| `finantra_transactions` | Array of all saved transactions |
| `finantra_custom_income` | User's custom income categories |
| `finantra_custom_expense` | User's custom expense categories |
| `finantra_user_id` | Generated once: `FT-2026-XXXX` |
| `finantra_user_profile` | `{name, email, phone, memberSince}` |
| `finantra_preferences` | `{defaultFilter, startingBalance, theme}` |

### Transaction Object Structure
```javascript
{
  id:       1710000000000,     // Date.now()
  type:     "Income",          // or "Expense"
  amount:   500.00,            // float
  category: "Food & Dining",
  emoji:    "🍕",
  date:     "2026-03-24",      // YYYY-MM-DD
  payment:  "UPI",             // Cash|UPI|Card|Bank Transfer
  notes:    "Lunch"            // string, max 150 chars
}
```

---

## Key Design Decisions

| Decision | Details |
|----------|---------|
| Primary color | `#1f82a6` |
| Accent | `teal` |
| Dashboard BG | `#f6f9fb` |
| Navbar color | `#6cc7d1` |
| Income | `#28a745` green |
| Expense | `#dc3545` red |
| Font | Segoe UI (body), Cambria (brand) |
| Page flow | Landing → Login → Dashboard |
| Sidebar desktop | Collapsible 260px ↔ 70px |
| Sidebar mobile | Hidden, hamburger opens drawer |
| Auth | localStorage `isLoggedIn` flag |
| Blog + FAQ | Public — no login needed |
| Dark mode | Profile toggle, inner pages only |
| No JS framework | Pure vanilla JS throughout |
| PDF numbers | Use `Rs.` not `₹` in jsPDF |
| Logo in PDF | 200×200 canvas with arc clip for circle |

---

## What Was Last Worked On
- `statement.html` — SOA with jsPDF, category summary, circular logo fix ✅
- `profile.html` — dark mode toggle, user ID, financial summary ✅
- `dashboard.js` — shared modal system, applySavedTheme, real localStorage data ✅
- `dashboard.css` — dark mode for all inner pages, modal CSS ✅
- `addTransaction.js` — delete custom categories, starting balance fix ✅

---

## What To Work On Next
1. **Assignment 7** — `currencyConverter.html` with real-time API
2. **Assignment 8** — Update `blog.html` to grid layout + category filter
3. `budgetPlanner.html`
4. `monthlyComparison.html`
5. `financialHealth.html` — with smart insights (originally planned here)

---

## Important Notes for Claude
- Never duplicate sidebar CSS — always use `dashboard.css`
- `dashboard.js` has `applySavedTheme()` + modal system — safe on all inner pages
- `dashboard.js` has `isDashboard` guard for chart functions
- PDF uses `formatINR_PDF()` (Rs.) — screen uses `formatINR()` (₹)
- Logo in PDF uses 200×200 canvas with `ctx.arc()` clip for circular shape
- Transaction data key: `finantra_transactions`
- Starting balance from: `finantra_preferences.startingBalance`
- Student project — pure vanilla JS, no frameworks
- Font Awesome 6.5.0 via CDN on all pages
- Chart.js via CDN on dashboard + analytics
- jsPDF + jsPDF-autotable via CDN on statement only