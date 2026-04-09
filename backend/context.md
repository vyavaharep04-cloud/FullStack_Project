# FinanTra — Project Context File
> Last Updated: 04-04-2026
> Use this file at the start of every new chat to give Claude full project context.
> Just upload this file and say "Here's my project context, let's continue with [task]"

---

## Project Overview
- **Name:** FinanTra — Personal Finance Tracker
- **Type:** Full Stack Web Application (Frontend complete, Backend in progress)
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

### Backend (In Progress 🔄)
- Node.js + Express.js
- MongoDB Atlas (free tier, AWS, 512MB) — project name: finantra
- Mongoose (ODM)
- JWT (jsonwebtoken) — authentication
- bcryptjs — password hashing
- cors, dotenv
- **IMPORTANT: package.json has `"type": "module"` — use ES module syntax everywhere (import/export, NOT require/module.exports)**
- **IMPORTANT: All internal imports must include .js extension e.g. '../models/User.js'**

### Tools
- VS Code, Git, GitHub, Chrome DevTools, Live Server (port 5500)
- Backend runs on port 3000
- CORS origin set to http://localhost:5500

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
├── css/                      ✅ All complete (see original context)
├── js/
│   ├── dataService.js        🔄 To be created (middleman layer)
│   └── [all other JS]        ✅ Complete
│
└── image/                    ✅ Complete

backend/
├── server.js                 ✅ Working (ES module syntax)
├── .env                      ✅ Created (PORT, MONGODB_URI, JWT_SECRET)
├── package.json              ✅ has "type":"module"
├── config/
│   └── db.js                 ✅ MongoDB connection working
├── models/
│   └── User.js               ✅ Created (ES module)
├── controllers/
│   └── auth.controller.js    ✅ Created (ES module)
├── routes/
│   └── auth.routes.js        ✅ Created (ES module)
└── middleware/
    └── auth.middleware.js    ✅ Created (ES module)
```

---

## Backend Progress

### ✅ Done
| Item | Details |
|------|---------|
| MongoDB Atlas connected | Free tier, AWS, finantra project |
| server.js | Express + cors + mongoose + dotenv, ES module |
| config/db.js | mongoose.connect with env URI |
| models/User.js | Full schema with bcrypt pre-save hook, matchPassword method |
| controllers/auth.controller.js | register, login, getMe — ES module exports |
| routes/auth.routes.js | POST /register, POST /login, GET /me (protected) |
| middleware/auth.middleware.js | JWT verify, attaches req.user |

### 🔄 Current Issue (last session ended here)
Error when running node server.js:
```
ERR_MODULE_NOT_FOUND: Cannot find module auth.controller.js
imported from auth.routes.js
```
**Most likely cause:** The actual file on disk is named differently (wrong case, missing, or in wrong folder). Fix: verify these files physically exist at exact paths:
- `backend/controllers/auth.controller.js`
- `backend/routes/auth.routes.js`
- `backend/middleware/auth.middleware.js`
- `backend/models/User.js`

Run in PowerShell to check:
```powershell
ls backend/controllers/
ls backend/routes/
ls backend/middleware/
ls backend/models/
```

### 🔲 Next (do in order)
| # | Task |
|---|------|
| 1 | Fix ERR_MODULE_NOT_FOUND — verify file names/locations |
| 2 | Test register: POST /api/auth/register |
| 3 | Test login: POST /api/auth/login |
| 4 | Build Transaction model + routes + controller |
| 5 | Build Budget routes |
| 6 | Build Savings Goals routes |
| 7 | Build Profile routes |
| 8 | Create dataService.js in frontend |
| 9 | Swap frontend from localStorage to backend (flip USE_BACKEND flag) |

---

## All Backend Files — Current Code

### server.js
```javascript
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5500' }));
app.use(express.json());

console.log("--- Environment Check ---");
console.log("PORT:", process.env.PORT);
console.log("URI EXISTS?:", !!process.env.MONGODB_URI);
console.log("-------------------------");

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ FinanTra Database Connected'))
  .catch(err => console.error('❌ Connection Error:', err.message));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'FinanTra backend is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
```

### config/db.js
```javascript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ FinanTra Database Connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
```

### models/User.js
```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone:    { type: String, default: '' },
  userId:   { type: String, unique: true },
  memberSince: { type: String },
  preferences: {
    defaultFilter:   { type: String, default: 'all' },
    startingBalance: { type: Number, default: 0 },
    theme:           { type: String, default: 'light' }
  },
  customIncomeCategories:  { type: [String], default: [] },
  customExpenseCategories: { type: [String], default: [] }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
```

### controllers/auth.controller.js
```javascript
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateUserId = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return 'FT-2026-' + rand;
};

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Email already registered' });

    const memberSince = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    const user = await User.create({
      name, email, password,
      phone: phone || '',
      userId: generateUserId(),
      memberSince
    });

    const token = generateToken(user._id);
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id, userId: user.userId, name: user.name,
        email: user.email, memberSince: user.memberSince,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id, userId: user.userId, name: user.name,
        email: user.email, memberSince: user.memberSince,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
```

### routes/auth.routes.js
```javascript
import express from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        protect, getMe);

export default router;
```

### middleware/auth.middleware.js
```javascript
import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token, access denied' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};

export default protect;
```

---

## dataService.js — Frontend Middleware Layer (to be added)

Location: `FRONTEND/js/dataService.js`
Link in every inner page HTML BEFORE the page-specific script, AFTER dashboard.js.

```javascript
const USE_BACKEND = false; // flip to true when backend is ready

function getToken() {
  return localStorage.getItem('finantra_token');
}

function authHeader() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}

const DataService = {
  getTransactions() {
    if (USE_BACKEND)
      return fetch('/api/transactions', { headers: authHeader() }).then(r => r.json());
    return Promise.resolve(JSON.parse(localStorage.getItem('finantra_transactions')) || []);
  },
  saveTransaction(txn) {
    if (USE_BACKEND)
      return fetch('/api/transactions', { method: 'POST', headers: authHeader(), body: JSON.stringify(txn) }).then(r => r.json());
    return this.getTransactions().then(txns => {
      txns.push(txn);
      localStorage.setItem('finantra_transactions', JSON.stringify(txns));
    });
  },
  deleteTransaction(id) {
    if (USE_BACKEND)
      return fetch('/api/transactions/' + id, { method: 'DELETE', headers: authHeader() });
    return this.getTransactions().then(txns => {
      localStorage.setItem('finantra_transactions', JSON.stringify(txns.filter(t => t.id !== id)));
    });
  },
  getGoals() {
    if (USE_BACKEND)
      return fetch('/api/goals', { headers: authHeader() }).then(r => r.json());
    return Promise.resolve(JSON.parse(localStorage.getItem('finantra_savings_goals')) || []);
  },
  saveGoals(goals) {
    if (USE_BACKEND) return Promise.resolve();
    localStorage.setItem('finantra_savings_goals', JSON.stringify(goals));
    return Promise.resolve();
  },
  getBudget(year, month) {
    if (USE_BACKEND)
      return fetch(`/api/budget/${year}/${month}`, { headers: authHeader() }).then(r => r.json());
    return Promise.resolve(JSON.parse(localStorage.getItem(`finantra_budget_${year}_${month}`)) || {});
  },
  saveBudget(year, month, data) {
    if (USE_BACKEND)
      return fetch(`/api/budget/${year}/${month}`, { method: 'POST', headers: authHeader(), body: JSON.stringify(data) });
    localStorage.setItem(`finantra_budget_${year}_${month}`, JSON.stringify(data));
    return Promise.resolve();
  },
  getProfile() {
    if (USE_BACKEND)
      return fetch('/api/profile', { headers: authHeader() }).then(r => r.json());
    return Promise.resolve(JSON.parse(localStorage.getItem('finantra_user_profile')) || {});
  },
  saveProfile(profile) {
    if (USE_BACKEND)
      return fetch('/api/profile', { method: 'PUT', headers: authHeader(), body: JSON.stringify(profile) });
    localStorage.setItem('finantra_user_profile', JSON.stringify(profile));
    return Promise.resolve();
  }
};
```

---

## All 10 Assignments Status

| # | Requirement | Implementation | Status |
|---|------------|----------------|--------|
| 1 | Responsive landing page | landing.html | ✅ Done |
| 2 | Multi-section portfolio | landing.html | ✅ Done |
| 3 | Blog article page | blog.html | ✅ Done |
| 4 | Collapsible FAQ | faq.html + faq.js | ✅ Done |
| 5 | Live character counter | landing.html + addTransaction.html | ✅ Done |
| 6 | Modal popup | dashboard.js + dashboard.css | ✅ Done |
| 7 | Currency converter with API | currencyConverter.html | ✅ Done |
| 8 | Image grid with category filter | blog.html needs update | 🔲 Pending |
| 9 | Dark/light theme toggle | profile.html + dashboard.css | ✅ Done |
| 10 | Responsive project | Entire FinanTra | ✅ Done |

---

## Key Design Decisions

| Decision | Details |
|----------|---------|
| Primary color | `#1f82a6` |
| Accent | teal / `#6cc7d1` |
| Dashboard BG | `#f6f9fb` |
| Income | `#28a745` green |
| Expense | `#dc3545` red |
| Font | Segoe UI (body), Cambria (brand) |
| Auth (current) | localStorage `isLoggedIn` flag — will move to JWT |
| PDF numbers | Use `Rs.` not `₹` in jsPDF |

---

## localStorage Keys (Frontend — until backend swap)

| Key | Purpose |
|-----|---------|
| `isLoggedIn` | "true" when logged in |
| `finantra_token` | JWT token (after backend swap) |
| `finantra_transactions` | Array of all transactions |
| `finantra_custom_income` | Custom income categories |
| `finantra_custom_expense` | Custom expense categories |
| `finantra_user_id` | FT-2026-XXXX |
| `finantra_user_profile` | {name, email, phone, memberSince} |
| `finantra_preferences` | {defaultFilter, startingBalance, theme} |
| `finantra_budget_YYYY_MM` | Budget Planner data per month |
| `finantra_savings_goals` | Array of savings goals |
| `finantra_fh_score_YYYY_MM` | Financial Health score per month |

---

## Transaction Object Structure
```javascript
{
  id:       1710000000000,
  type:     "Income",        // or "Expense"
  amount:   500.00,
  category: "Food & Dining",
  emoji:    "🍕",
  date:     "2026-03-24",
  payment:  "UPI",
  notes:    "Lunch"
}
```

## Savings Goal Object Structure
```javascript
{
  id:             "1710000000000",
  goalName:       "Buy Laptop",
  targetAmount:   50000,
  savedAmount:    20000,
  deadline:       "2026-12-31",
  emoji:          "💻",
  priority:       "High",
  statusOverride: "auto",
  createdAt:      "2026-01-01",
  contributions:  [
    { id: 123, amount: 5000, date: "2026-02-01", note: "Monthly saving" }
  ]
}
```

---

## Planned API Routes

```
POST   /api/auth/register       ✅ built
POST   /api/auth/login          ✅ built
GET    /api/auth/me             ✅ built (protected)

GET    /api/transactions        🔲 next
POST   /api/transactions        🔲 next
DELETE /api/transactions/:id    🔲 next

GET    /api/budget/:year/:month 🔲 next
POST   /api/budget/:year/:month 🔲 next

GET    /api/goals               🔲 next
POST   /api/goals               🔲 next
PUT    /api/goals/:id           🔲 next
DELETE /api/goals/:id           🔲 next
POST   /api/goals/:id/contribute 🔲 next

GET    /api/profile             🔲 next
PUT    /api/profile             🔲 next
```

---

## Important Notes for Claude

### Backend
- package.json has "type":"module" — ALWAYS use import/export, never require/module.exports
- All internal imports need .js extension: '../models/User.js' not '../models/User'
- JWT_SECRET is in .env — never hardcode
- bcryptjs installed (not bcrypt)
- Last error before context save: ERR_MODULE_NOT_FOUND for auth.controller.js — likely file not physically created yet or wrong folder

### Frontend
- Never duplicate sidebar CSS — always use dashboard.css
- dashboard.js has applySavedTheme() + modal system
- PDF uses formatINR_PDF() (Rs.) — screen uses formatINR() (₹)
- Transaction data key: finantra_transactions
- Starting balance from: finantra_preferences.startingBalance
- Pure vanilla JS, no frameworks
- ExchangeRate-API key: 453b674d2b027f6896fa52ac