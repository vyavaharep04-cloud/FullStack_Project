// js/dataService.js
// ONE flag to switch between localStorage and backend
const USE_BACKEND = false; // Change to true when backend is ready

// Helper to get JWT token from localStorage (needed later for API calls)
function getToken() {
  return localStorage.getItem('finantra_token');
}

// Helper to build auth headers for fetch calls
function authHeader() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}

// ─── TRANSACTIONS ────────────────────────────────────────────
const DataService = {

  getTransactions() {
    if (USE_BACKEND) {
      return fetch('/api/transactions', { headers: authHeader() })
        .then(res => res.json());
    }
    return Promise.resolve(
      JSON.parse(localStorage.getItem('finantra_transactions')) || []
    );
  },

  saveTransaction(txn) {
    if (USE_BACKEND) {
      return fetch('/api/transactions', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(txn)
      }).then(res => res.json());
    }
    return this.getTransactions().then(txns => {
      txns.push(txn);
      localStorage.setItem('finantra_transactions', JSON.stringify(txns));
    });
  },

  deleteTransaction(id) {
    if (USE_BACKEND) {
      return fetch('/api/transactions/' + id, {
        method: 'DELETE',
        headers: authHeader()
      });
    }
    return this.getTransactions().then(txns => {
      const updated = txns.filter(t => t.id !== id);
      localStorage.setItem('finantra_transactions', JSON.stringify(updated));
    });
  },

  // ─── SAVINGS GOALS ────────────────────────────────────────
  getGoals() {
    if (USE_BACKEND) {
      return fetch('/api/goals', { headers: authHeader() }).then(res => res.json());
    }
    return Promise.resolve(
      JSON.parse(localStorage.getItem('finantra_savings_goals')) || []
    );
  },

  saveGoals(goals) {
    if (USE_BACKEND) {
      // handled per-goal via POST/PUT in backend
      return Promise.resolve();
    }
    localStorage.setItem('finantra_savings_goals', JSON.stringify(goals));
    return Promise.resolve();
  },

  // ─── BUDGET ───────────────────────────────────────────────
  getBudget(year, month) {
    const key = 'finantra_budget_' + year + '_' + month;
    if (USE_BACKEND) {
      return fetch('/api/budget/' + year + '/' + month, { headers: authHeader() })
        .then(res => res.json());
    }
    return Promise.resolve(
      JSON.parse(localStorage.getItem(key)) || {}
    );
  },

  saveBudget(year, month, data) {
    const key = 'finantra_budget_' + year + '_' + month;
    if (USE_BACKEND) {
      return fetch('/api/budget/' + year + '/' + month, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(data)
      });
    }
    localStorage.setItem(key, JSON.stringify(data));
    return Promise.resolve();
  },

  // ─── USER PROFILE ─────────────────────────────────────────
  getProfile() {
    if (USE_BACKEND) {
      return fetch('/api/profile', { headers: authHeader() }).then(res => res.json());
    }
    return Promise.resolve(
      JSON.parse(localStorage.getItem('finantra_user_profile')) || {}
    );
  },

  saveProfile(profile) {
    if (USE_BACKEND) {
      return fetch('/api/profile', {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify(profile)
      });
    }
    localStorage.setItem('finantra_user_profile', JSON.stringify(profile));
    return Promise.resolve();
  }
};