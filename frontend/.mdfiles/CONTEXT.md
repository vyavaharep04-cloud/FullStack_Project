# FinanTra — Project Context File
> Last Updated: 04-04-2026
> Use this file at the start of every new chat to give Claude full project context.
> Just upload this file and say "Here's my project context, let's continue with [task]"

---

## Project Overview
- **Name:** FinanTra — Personal Finance Tracker
- **Type:** Full Stack Web Application (Frontend complete, Backend next)
- **Purpose:** Track income/expenses, visualize spending, manage budgets, savings goals, financial health
- **College:** S.Y. BTech CSE (AI & ML), PCCoE, Pune

---

## Technology Stack

### Frontend (Complete ✅)
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome 6.5.0 (CDN)
- Chart.js (CDN) — dashboard + analytics
- jsPDF 2.5.1 + jsPDF-autotable 3.5.31 (CDN) — SOA PDF generation
- No frameworks — pure HTML/CSS/JS

### Backend (Next Phase)
- Node.js + Express.js
- MongoDB (database)
- Mongoose (ODM)
- JWT (authentication)
- bcrypt (password hashing)

### Tools
- VS Code, Git, GitHub, Chrome DevTools, Live Server (port 5500)

---

## Folder Structure

```
FRONTEND/
│
├── landing.html              ✅ Complete
├── login.html                ✅ Complete
├── createAcc.html            ✅ Complete
├── password.html             ✅ Complete
├── dashboard.html            ✅ Complete
├── addTransaction.html       ✅ Complete
├── transactions.html         ✅ Complete
├── analytics.html            ✅ Complete
├── statement.html            ✅ Complete (SOA)
├── profile.html              ✅ Complete
├── blog.html                 ✅ Complete
├── faq.html                  ✅ Complete
├── budgetPlanner.html        ✅ Complete
├── savingsGoal.html          ✅ Complete
├── financialHealth.html      ✅ Complete
├── currencyConverter.html    ✅ Complete (Assignment 7)
│
├── css/
│   ├── landing.css           ✅ Shared — navbar, footer, hero, sections
│   ├── auth.css              ✅ Login, createAcc, password pages
│   ├── dashboard.css         ✅ Shared — sidebar, layout, cards, dark mode, modal
│   ├── addTransaction.css    ✅ Page specific
│   ├── transactions.css      ✅ Page specific
│   ├── analytics.css         ✅ Page specific
│   ├── statement.css         ✅ Page specific + print styles
│   ├── profile.css           ✅ Page specific + profile dark mode
│   ├── blog.css              ✅ Page specific
│   ├── faq.css               ✅ Page specific
│   ├── budgetPlanner.css     ✅ Page specific
│   ├── savingsGoal.css       ✅ Page specific
│   ├── financialHealth.css   ✅ Page specific
│   └── currencyConverter.css ✅ Page specific
│
├── js/
│   ├── landing.js            ✅ Navbar toggle, contact form, char counter
│   ├── auth.js               ✅ Login, createAcc, password logic
│   ├── dashboard.js          ✅ Shared — sidebar, charts, modal, theme
│   ├── addTransaction.js     ✅ Multi-session, custom categories, localStorage
│   ├── transactions.js       ✅ Filter, search, sort, delete, load more
│   ├── analytics.js          ✅ 6 Chart.js charts, real localStorage data
│   ├── statement.js          ✅ SOA generation, jsPDF, category summary
│   ├── profile.js            ✅ Profile, preferences, dark mode, data mgmt
│   ├── blog.js               ✅ Article expand/collapse
│   ├── faq.js                ✅ Accordion, category filter, search
│   ├── budgetPlanner.js      ✅ Budget CRUD, progress bars, monthly reset
│   ├── savingsGoal.js        ✅ Goal CRUD, contributions, history, achieved
│   ├── financialHealth.js    ✅ Score engine, insights, snapshots
│   └── currencyConverter.js  ✅ ExchangeRate-API, swap, quick pairs
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

## All 10 Assignments Status

| # | Requirement | Implementation | Status |
|---|------------|----------------|--------|
| 1 | Responsive landing page with hero, features, CTA | `landing.html` | ✅ Done |
| 2 | Multi-section portfolio with nav, showcase, contact | `landing.html` | ✅ Done |
| 3 | Blog article page with title, author, image, CSS | `blog.html` | ✅ Done |
| 4 | Collapsible FAQ with JS toggle | `faq.html` + `faq.js` | ✅ Done |
| 5 | Live character counter DOM manipulation | `landing.html` + `addTransaction.html` | ✅ Done |
| 6 | Modal popup — opens on click, closes outside/icon | `dashboard.js` + `dashboard.css` | ✅ Done |
| 7 | Currency converter with real-time API | `currencyConverter.html` | ✅ Done |
| 8 | Image grid with category filtering | `blog.html` needs grid + filter update | 🔲 Pending |
| 9 | Dark/light theme toggle with CSS custom properties | `profile.html` + `dashboard.css` | ✅ Done |
| 10 | Responsive project | Entire FinanTra | ✅ Done |

---

## Pages — Complete Summary

### ✅ All Complete

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
| budgetPlanner.html | Category budgets, cap, daily guidance, unbudgeted tracker, monthly history, reset dialog |
| savingsGoal.html | Goal CRUD, emoji picker, contributions, history modal, achieved section, priority, status |
| financialHealth.html | SVG gauge, 4 sub-scores, trend arrow, income vs expense, both snapshots, CSS breakdown, smart insights |
| currencyConverter.html | 30 currencies, live API, swap button, 6 quick pairs, timestamp |

### 🔲 Pending (1 item)
| Page | Description |
|------|-------------|
| blog.html update | Assignment 8 — add image grid layout + category filter |

---

## Smart Tools — Feature Details

### Budget Planner (`budgetPlanner.html`)
- Month selector: current month + past months with saved data
- Summary strip: Total Income, Total Spent, Total Budget, Remaining
- Monthly Budget Cap with progress bar + smart alert (green/yellow/red)
- Daily Spending Guidance: safe daily amount, days left, avg daily spend
- Category budgets: inline edit + bulk edit modal
- Add category panel: all default + custom + transaction-detected categories
- Unbudgeted tracker: spending without budget set, "Set Budget" quick-add
- Monthly reset dialog: Keep Same / Start Fresh when new month detected
- History: each month saved as `finantra_budget_YYYY_MM` in localStorage

### Savings Goal Planner (`savingsGoal.html`)
- Full-width goal cards, manual ordering (up/down arrows)
- Create/Edit modal: emoji picker (16 options + custom), starting amount, deadline, priority, status override
- Priority: High/Medium/Low — color-coded card border
- Status: Auto-calculated (time elapsed % vs saved %) + manual override
- Expected vs actual comparison marker on progress bar
- Smart monthly suggestion: remaining ÷ months left
- Add Contribution modal: amount, date, note
- Last 3 contributions shown on card + full history in modal
- Achieved goals section: auto-moves completed goals, collapsible
- Summary strip: Active Goals, Total Target, Total Saved, Achieved
- localStorage key: `finantra_savings_goals`

### Financial Health (`financialHealth.html`)
- Period selector: This Month / Last 3 Months / This Year
- SVG circular gauge (stroke-dashoffset animation) with score 0–100
- Score bands: 80+ Excellent, 60–79 Good, 40–59 Needs Improvement, <40 Risky
- Score trend arrow: compares vs previous month (saved as `finantra_fh_score_YYYY_MM`)
- 4 weighted sub-scores: Savings Ratio (40%), Expense Control (30%), Income Stability (20%), Budget Adherence (10%)
- Budget Adherence reads Budget Planner data for selected period
- Income vs Expenses: stat cards + dual bars + dynamic insight line
- Budget Snapshot: spent vs budget, categories within limit, cap usage
- Goals Snapshot: active/achieved count, total saved, overall progress
- Expense breakdown: pure CSS bars, top 6 categories, ⚠️ high-spend flag (>35%)
- Smart Insights: dynamic (data-driven) + 1 rotating fixed tip, sorted Critical → Warning → Positive

### Currency Converter (`currencyConverter.html`)
- API: ExchangeRate-API v6 (`https://v6.exchangerate-api.com/v6/453b674d2b027f6896fa52ac/latest/`)
- 30 currencies with flag emojis
- Swap button with 180° spin animation
- 6 popular quick-pairs with live rates loaded on page open
- Result banner: converted value + both rate directions + last-update timestamp
- Error handling, loading states, Enter key support

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

## localStorage Keys (Frontend)

| Key | Purpose |
|-----|---------|
| `isLoggedIn` | "true" when logged in |
| `finantra_transactions` | Array of all saved transactions |
| `finantra_custom_income` | User's custom income categories |
| `finantra_custom_expense` | User's custom expense categories |
| `finantra_user_id` | Generated once: `FT-2026-XXXX` |
| `finantra_user_profile` | `{name, email, phone, memberSince}` |
| `finantra_preferences` | `{defaultFilter, startingBalance, theme}` |
| `finantra_budget_YYYY_MM` | Budget Planner data per month |
| `finantra_savings_goals` | Array of all savings goals |
| `finantra_fh_score_YYYY_MM` | Financial Health score per month (trend) |

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

### Savings Goal Object Structure
```javascript
{
  id:             "1710000000000",
  goalName:       "Buy Laptop",
  targetAmount:   50000,
  savedAmount:    20000,
  deadline:       "2026-12-31",
  emoji:          "💻",
  priority:       "High",          // High | Medium | Low
  statusOverride: "auto",          // auto | on-track | behind | critical
  createdAt:      "2026-01-01",
  contributions:  [
    { id: 123, amount: 5000, date: "2026-02-01", note: "Monthly saving" }
  ]
}
```

---

## Key Design Decisions

| Decision | Details |
|----------|---------|
| Primary color | `#1f82a6` |
| Accent | `teal` / `#6cc7d1` |
| Dashboard BG | `#f6f9fb` |
| Navbar color | `#6cc7d1` |
| Income | `#28a745` green |
| Expense | `#dc3545` red |
| Warning | `#f0a500` amber |
| Font | Segoe UI (body), Cambria (brand) |
| Page flow | Landing → Login → Dashboard |
| Sidebar desktop | Collapsible 260px ↔ 70px |
| Sidebar mobile | Hidden, hamburger opens drawer |
| Auth | localStorage `isLoggedIn` flag (frontend only, will move to JWT) |
| Blog + FAQ | Public — no login needed |
| Dark mode | Profile toggle, inner pages only |
| No JS framework | Pure vanilla JS throughout |
| PDF numbers | Use `Rs.` not `₹` in jsPDF |
| Logo in PDF | 200×200 canvas with arc clip for circle |

---

## Sidebar Nav Structure (all inner pages)

```
Finance Core
  - Dashboard
  - Add Transaction
  - Transactions
  - Analytics

Smart Tools
  - Budget Planner
  - Savings Goals          ← was "Monthly Comparison" (replaced)
  - Financial Health
  - Currency Converter
  - SOA Statement

Account Info
  - Profile
  - Sign Out
```

**Note:** Monthly Comparison page was dropped — dashboard already covers this.
**Note:** Sidebar link text/icon updates (Monthly Comparison → Savings Goals) are pending minor text changes across all inner pages.

---

## Backend Plan (Next Phase)

### What needs to move from localStorage → MongoDB
| Data | Current (localStorage) | Backend (MongoDB) |
|------|------------------------|-------------------|
| User profile | `finantra_user_profile` | `users` collection |
| Auth | `isLoggedIn` flag | JWT tokens |
| Transactions | `finantra_transactions` | `transactions` collection |
| Budget data | `finantra_budget_YYYY_MM` | `budgets` collection |
| Savings goals | `finantra_savings_goals` | `goals` collection |
| Preferences | `finantra_preferences` | part of `users` doc |

### Planned Backend Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (JSON Web Tokens) + bcrypt
- **API style:** REST API
- **Port:** 3000 (backend) — frontend stays on Live Server port 5500

### Planned API Routes (rough)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/transactions
POST   /api/transactions
DELETE /api/transactions/:id

GET    /api/budget/:year/:month
POST   /api/budget/:year/:month

GET    /api/goals
POST   /api/goals
PUT    /api/goals/:id
DELETE /api/goals/:id
POST   /api/goals/:id/contribute

GET    /api/profile
PUT    /api/profile
```

---

## Important Notes for Claude

### Frontend
- Never duplicate sidebar CSS — always use `dashboard.css`
- `dashboard.js` has `applySavedTheme()` + modal system — safe on all inner pages
- `dashboard.js` has `isDashboard` guard for chart functions
- PDF uses `formatINR_PDF()` (Rs.) — screen uses `formatINR()` (₹)
- Transaction data key: `finantra_transactions`
- Starting balance from: `finantra_preferences.startingBalance`
- Student project — pure vanilla JS, no frameworks
- Font Awesome 6.5.0 via CDN on all pages
- Chart.js via CDN on dashboard + analytics only
- jsPDF + jsPDF-autotable via CDN on statement only
- ExchangeRate-API key: `453b674d2b027f6896fa52ac`

### Backend (when starting)
- Keep frontend working on localStorage while backend is being built
- Migrate one feature at a time (start with auth → transactions → budget → goals)
- Frontend fetch calls will replace localStorage reads/writes
- CORS needed since frontend (5500) and backend (3000) are different ports
- Use `.env` file for MongoDB URI, JWT secret — never hardcode