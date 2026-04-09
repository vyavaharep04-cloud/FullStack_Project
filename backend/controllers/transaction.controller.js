import Transaction from '../models/Transaction.js';

// GET /api/transactions
// Returns all transactions for the logged-in user, newest first
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ date: -1, createdAt: -1 });

    // Shape response to match frontend transaction object structure
    const formatted = transactions.map(t => ({
      id:       t._id,
      type:     t.type,
      amount:   t.amount,
      category: t.category,
      emoji:    t.emoji,
      date:     t.date,
      payment:  t.payment,
      notes:    t.notes
    }));

    res.json(formatted);
  } catch (error) {
    console.error('getTransactions error:', error.message);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
};

// POST /api/transactions
// Creates a new transaction for the logged-in user
// export const addTransaction = async (req, res) => {
//   try {
//     const { type, amount, category, emoji, date, payment, notes } = req.body;

//     // Validate required fields
//     if (!type || !amount || !category || !date)
//       return res.status(400).json({ message: 'type, amount, category and date are required' });

//     if (!['Income', 'Expense'].includes(type))
//       return res.status(400).json({ message: 'type must be Income or Expense' });

//     if (isNaN(amount) || Number(amount) <= 0)
//       return res.status(400).json({ message: 'amount must be a positive number' });

//     const transaction = await Transaction.create({
//       user:     req.user.id,
//       type,
//       amount:   Number(amount),
//       category: category.trim(),
//       emoji:    emoji || '💰',
//       date,
//       payment:  payment  || '',
//       notes:    notes    || ''
//     });

//     res.status(201).json({
//       message: 'Transaction added successfully',
//       transaction: {
//         id:       transaction._id,
//         type:     transaction.type,
//         amount:   transaction.amount,
//         category: transaction.category,
//         emoji:    transaction.emoji,
//         date:     transaction.date,
//         payment:  transaction.payment,
//         notes:    transaction.notes
//       }
//     });
//   } catch (error) {
//     console.error('addTransaction error:', error.message);
//     res.status(500).json({ message: 'Server error adding transaction' });
//   }
// };

// POST /api/transactions
// Creates a new transaction (or multiple transactions) for the logged-in user
export const addTransaction = async (req, res) => {
  try {
    // 🌟 NEW: Check if the frontend sent an Array (Bulk Save)
    if (Array.isArray(req.body)) {
      // Loop through the array and attach the logged-in user's ID to every item
      const transactionsWithUser = req.body.map(txn => ({
        ...txn,
        user: req.user.id,
        amount: Number(txn.amount),
        emoji: txn.emoji || '💰',
        payment: txn.payment || '',
        notes: txn.notes || ''
      }));

      // Insert them all into MongoDB at once!
      const savedTransactions = await Transaction.insertMany(transactionsWithUser);
      return res.status(201).json({ 
        message: `${savedTransactions.length} transactions saved successfully`, 
        transactions: savedTransactions 
      });
    }

    // --- ORIGINAL SINGLE SAVE LOGIC (Kept just in case) ---
    const { type, amount, category, emoji, date, payment, notes } = req.body;

    if (!type || !amount || !category || !date)
      return res.status(400).json({ message: 'type, amount, category and date are required' });

    if (!['Income', 'Expense'].includes(type))
      return res.status(400).json({ message: 'type must be Income or Expense' });

    const transaction = await Transaction.create({
      user:     req.user.id,
      type,
      amount:   Number(amount),
      category: category.trim(),
      emoji:    emoji || '💰',
      date,
      payment:  payment  || '',
      notes:    notes    || ''
    });

    res.status(201).json({ message: 'Transaction added successfully', transaction });

  } catch (error) {
    console.error('addTransaction error:', error.message);
    res.status(500).json({ message: 'Server error adding transaction(s)' });
  }
};

// DELETE /api/transactions/:id
// Deletes a transaction — only if it belongs to the logged-in user
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction)
      return res.status(404).json({ message: 'Transaction not found' });

    // Security check — prevent users from deleting each other's transactions
    if (transaction.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorised to delete this transaction' });

    await transaction.deleteOne();
    res.json({ message: 'Transaction deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('deleteTransaction error:', error.message);
    res.status(500).json({ message: 'Server error deleting transaction' });
  }
};