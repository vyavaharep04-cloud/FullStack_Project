import SavingsGoal from '../models/SavingsGoal.js';

// Helper — shapes a DB doc into the exact frontend object
const fmt = (g) => ({
  id:             g._id,
  goalName:       g.goalName,
  targetAmount:   g.targetAmount,
  savedAmount:    g.savedAmount,
  deadline:       g.deadline,
  emoji:          g.emoji,
  priority:       g.priority,
  statusOverride: g.statusOverride,
  createdAt:      g.createdAt_str || g.createdAt.toISOString().slice(0, 10),
  contributions:  g.contributions
});

// GET /api/goals
export const getGoals = async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(goals.map(fmt));
  } catch (err) {
    console.error('getGoals error:', err.message);
    res.status(500).json({ message: 'Server error fetching goals' });
  }
};

// POST /api/goals
export const addGoal = async (req, res) => {
  try {
    const { goalName, targetAmount, savedAmount, deadline, emoji, priority, statusOverride, createdAt } = req.body;

    if (!goalName || targetAmount === undefined || !deadline)
      return res.status(400).json({ message: 'goalName, targetAmount and deadline are required' });

    if (isNaN(targetAmount) || Number(targetAmount) < 0)
      return res.status(400).json({ message: 'targetAmount must be a non-negative number' });

    const goal = await SavingsGoal.create({
      user:           req.user.id,
      goalName:       goalName.trim(),
      targetAmount:   Number(targetAmount),
      savedAmount:    Number(savedAmount) || 0,
      deadline,
      emoji:          emoji          || '🎯',
      priority:       priority       || 'Medium',
      statusOverride: statusOverride || 'auto',
      createdAt_str:  createdAt      || new Date().toISOString().slice(0, 10),
      contributions:  []
    });

    res.status(201).json({ message: 'Goal created successfully', goal: fmt(goal) });
  } catch (err) {
    console.error('addGoal error:', err.message);
    res.status(500).json({ message: 'Server error creating goal' });
  }
};

// PUT /api/goals/:id  — update goal fields (not contributions)
export const updateGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorised' });

    const allowed = ['goalName', 'targetAmount', 'savedAmount', 'deadline', 'emoji', 'priority', 'statusOverride'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) goal[field] = req.body[field];
    });

    await goal.save();
    res.json({ message: 'Goal updated successfully', goal: fmt(goal) });
  } catch (err) {
    console.error('updateGoal error:', err.message);
    res.status(500).json({ message: 'Server error updating goal' });
  }
};

// DELETE /api/goals/:id
export const deleteGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorised' });

    await goal.deleteOne();
    res.json({ message: 'Goal deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('deleteGoal error:', err.message);
    res.status(500).json({ message: 'Server error deleting goal' });
  }
};

// POST /api/goals/:id/contribute
// Body: { id, amount, date, note }
export const addContribution = async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorised' });

    const { id, amount, date, note } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return res.status(400).json({ message: 'amount must be a positive number' });
    if (!date)
      return res.status(400).json({ message: 'date is required' });

    const contribution = {
      id:     id     || Date.now(),
      amount: Number(amount),
      date,
      note:   note   || ''
    };

    goal.contributions.push(contribution);
    goal.savedAmount = Number((goal.savedAmount + contribution.amount).toFixed(2));
    await goal.save();

    res.status(201).json({ message: 'Contribution added', goal: fmt(goal) });
  } catch (err) {
    console.error('addContribution error:', err.message);
    res.status(500).json({ message: 'Server error adding contribution' });
  }
};