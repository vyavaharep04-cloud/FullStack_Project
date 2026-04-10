// ============================================================
//  FinanTra — dataService.js
//  Middleman between frontend pages and data source.
// ============================================================

const USE_BACKEND = true; // KEEP THIS TRUE!
// const BASE_URL    = 'http://localhost:3000/api';
const BASE_URL    = 'https://fullstack-project-d7l0.onrender.com/api'; // ✅ Correct for the internet
// ------------------------------------------------------------
//  Auth & Guest Helpers
// ------------------------------------------------------------

function getToken() {
  return localStorage.getItem('finantra_token');
}

function isGuest() {
  return !getToken();
}

function authHeader() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}

// Generic fetch wrapper — 8s timeout, throws on non-2xx
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(BASE_URL + path, {
      ...options,
      signal:  controller.signal,
      headers: { ...authHeader(), ...(options.headers || {}) }
    });
    clearTimeout(timer);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timed out — is the server running?');
    throw err;
  }
}

// ============================================================
//  DataService
// ============================================================

const DataService = {

  // ----------------------------------------------------------
  //  GUEST CHECK — exposed so page scripts can use it
  // ----------------------------------------------------------

  isGuest() {
    return !getToken();
  },

  // ----------------------------------------------------------
  //  AUTH
  // ----------------------------------------------------------

  async register(payload) {
    const res = await fetch(BASE_URL + '/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('finantra_token', data.token);
    localStorage.setItem('isLoggedIn', 'true');
    _cacheUserFromResponse(data.user);
    return data;
  },

  async login(email, password) {
    const res = await fetch(BASE_URL + '/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('finantra_token', data.token);
    localStorage.setItem('isLoggedIn',     'true');
    _cacheUserFromResponse(data.user);
    return data;
  },

  logout() {
    const keysToRemove = [
      'finantra_token', 'isLoggedIn',
      'finantra_user_id', 'finantra_user_profile', 'finantra_preferences'
    ];

    // Guests keep their localStorage data across sessions intentionally
    if (USE_BACKEND && !isGuest()) {
      keysToRemove.push(
        'finantra_transactions',
        'finantra_savings_goals',
        'finantra_custom_income',
        'finantra_custom_expense'
      );
      Object.keys(localStorage)
        .filter(k => k.startsWith('finantra_budget_') || k.startsWith('finantra_fh_score_'))
        .forEach(k => localStorage.removeItem(k));
    }

    keysToRemove.forEach(k => localStorage.removeItem(k));
    window.location.href = 'login.html';
  },

  // ----------------------------------------------------------
  //  TRANSACTIONS
  // ----------------------------------------------------------

  async getTransactions() {
    if (USE_BACKEND && !isGuest()) {
      return await apiFetch('/transactions');
    }
    return JSON.parse(localStorage.getItem('finantra_transactions')) || [];
  },

  async addTransaction(txn) {
    if (USE_BACKEND && !isGuest()) {
      const result = await apiFetch('/transactions', {
        method: 'POST',
        body:   JSON.stringify(txn)
      });
      return result.transaction;
    }
    const txns = await this.getTransactions();
    const newTxn = { ...txn, id: Date.now() };
    txns.unshift(newTxn);
    localStorage.setItem('finantra_transactions', JSON.stringify(txns));
    return newTxn;
  },

  async deleteTransaction(id) {
    if (USE_BACKEND && !isGuest()) {
      await apiFetch('/transactions/' + id, { method: 'DELETE' });
      return;
    }
    const txns = await this.getTransactions();
    localStorage.setItem(
      'finantra_transactions',
      JSON.stringify(txns.filter(t => String(t.id) !== String(id)))
    );
  },

  // ----------------------------------------------------------
  //  BUDGET
  // ----------------------------------------------------------

  async getBudget(year, month) {
    if (USE_BACKEND && !isGuest()) {
      return await apiFetch(`/budget/${year}/${month}`);
    }
    return JSON.parse(localStorage.getItem(`finantra_budget_${year}_${month}`)) || { year, month, categories: [] };
  },

  async saveBudget(year, month, categories) {
    if (USE_BACKEND && !isGuest()) {
      await apiFetch(`/budget/${year}/${month}`, {
        method: 'POST',
        body:   JSON.stringify({ categories })
      });
      return;
    }
    localStorage.setItem(
      `finantra_budget_${year}_${month}`,
      JSON.stringify({ year, month, categories })
    );
  },

  // ----------------------------------------------------------
  //  SAVINGS GOALS
  // ----------------------------------------------------------

  async getGoals() {
    if (USE_BACKEND && !isGuest()) {
      return await apiFetch('/goals');
    }
    return JSON.parse(localStorage.getItem('finantra_savings_goals')) || [];
  },

  async addGoal(goal) {
    if (USE_BACKEND && !isGuest()) {
      const result = await apiFetch('/goals', {
        method: 'POST',
        body:   JSON.stringify(goal)
      });
      return result.goal;
    }
    const goals = await this.getGoals();
    const newGoal = { ...goal, id: String(Date.now()), contributions: [] };
    goals.push(newGoal);
    localStorage.setItem('finantra_savings_goals', JSON.stringify(goals));
    return newGoal;
  },

  async updateGoal(id, updates) {
    if (USE_BACKEND && !isGuest()) {
      const result = await apiFetch('/goals/' + id, {
        method: 'PUT',
        body:   JSON.stringify(updates)
      });
      return result.goal;
    }
    const goals = await this.getGoals();
    const idx = goals.findIndex(g => String(g.id) === String(id));
    if (idx === -1) throw new Error('Goal not found');
    goals[idx] = { ...goals[idx], ...updates };
    localStorage.setItem('finantra_savings_goals', JSON.stringify(goals));
    return goals[idx];
  },

  async deleteGoal(id) {
    if (USE_BACKEND && !isGuest()) {
      await apiFetch('/goals/' + id, { method: 'DELETE' });
      return;
    }
    const goals = await this.getGoals();
    localStorage.setItem(
      'finantra_savings_goals',
      JSON.stringify(goals.filter(g => String(g.id) !== String(id)))
    );
  },

  async addContribution(goalId, contribution) {
    if (USE_BACKEND && !isGuest()) {
      const result = await apiFetch('/goals/' + goalId + '/contribute', {
        method: 'POST',
        body:   JSON.stringify(contribution)
      });
      return result.goal;
    }
    const goals = await this.getGoals();
    const idx = goals.findIndex(g => String(g.id) === String(goalId));
    if (idx === -1) throw new Error('Goal not found');
    const c = { ...contribution, id: contribution.id || Date.now() };
    goals[idx].contributions.push(c);
    goals[idx].savedAmount = parseFloat(
      (Number(goals[idx].savedAmount) + Number(c.amount)).toFixed(2)
    );
    localStorage.setItem('finantra_savings_goals', JSON.stringify(goals));
    return goals[idx];
  },

  // ----------------------------------------------------------
  //  PROFILE
  // ----------------------------------------------------------

  async getProfile() {
    if (USE_BACKEND && !isGuest()) {
      return await apiFetch('/profile');
    }
    const profile   = JSON.parse(localStorage.getItem('finantra_user_profile'))  || {};
    const prefs     = JSON.parse(localStorage.getItem('finantra_preferences'))   || {};
    const customInc = JSON.parse(localStorage.getItem('finantra_custom_income')) || [];
    const customExp = JSON.parse(localStorage.getItem('finantra_custom_expense')) || [];
    return {
      userId:                  localStorage.getItem('finantra_user_id') || 'GUEST-0000',
      name:                    profile.name        || 'Guest User',
      email:                   profile.email       || 'guest@finantra.com',
      phone:                   profile.phone       || '',
      memberSince:             profile.memberSince || new Date().toISOString().slice(0, 10),
      preferences:             prefs,
      customIncomeCategories:  customInc,
      customExpenseCategories: customExp
    };
  },

  async saveProfile(updates) {
    if (USE_BACKEND && !isGuest()) {
      const result = await apiFetch('/profile', {
        method: 'PUT',
        body:   JSON.stringify(updates)
      });
      return result.profile;
    }

    // FIX: use 'in' operator — truthy check breaks on empty string fields like phone: ''
    if ('name' in updates || 'email' in updates || 'phone' in updates || 'memberSince' in updates) {
      const profile = JSON.parse(localStorage.getItem('finantra_user_profile')) || {};
      const merged  = { ...profile, ...updates };
      const { preferences, customIncomeCategories, customExpenseCategories, ...profileOnly } = merged;
      localStorage.setItem('finantra_user_profile', JSON.stringify(profileOnly));
    }
    if (updates.preferences) {
      const prefs = JSON.parse(localStorage.getItem('finantra_preferences')) || {};
      localStorage.setItem('finantra_preferences', JSON.stringify({ ...prefs, ...updates.preferences }));
    }
    if (updates.customIncomeCategories !== undefined) {
      localStorage.setItem('finantra_custom_income',  JSON.stringify(updates.customIncomeCategories));
    }
    if (updates.customExpenseCategories !== undefined) {
      localStorage.setItem('finantra_custom_expense', JSON.stringify(updates.customExpenseCategories));
    }
    return await this.getProfile();
  },

  // ----------------------------------------------------------
  //  FINANCIAL HEALTH SCORE (always localStorage — no backend route)
  // ----------------------------------------------------------

  getFHScore(year, month) {
    return JSON.parse(localStorage.getItem(`finantra_fh_score_${year}_${month}`)) || null;
  },

  saveFHScore(year, month, scoreData) {
    localStorage.setItem(`finantra_fh_score_${year}_${month}`, JSON.stringify(scoreData));
  }

};

// ----------------------------------------------------------
//  Internal — cache user fields after login / register
// ----------------------------------------------------------

function _cacheUserFromResponse(user) {
  if (!user) return;
  localStorage.setItem('finantra_user_id', user.userId || '');
  localStorage.setItem('finantra_user_profile', JSON.stringify({
    name:        user.name        || '',
    email:       user.email       || '',
    phone:       user.phone       || '',
    memberSince: user.memberSince || ''
  }));
  localStorage.setItem('finantra_preferences', JSON.stringify(user.preferences || {}));
}