import Budget from '../models/Budget.js';

// GET /api/budget/:year/:month
export const getBudget = async (req, res) => {
  try {
    const year  = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12)
      return res.status(400).json({ message: 'Invalid year or month' });

    const budget = await Budget.findOne({ user: req.user.id, year, month });

    if (!budget)
      return res.json({ year, month, monthlyCap: 0, categories: [] });   // Added monthlyCap fallback

    res.json({
      year:       budget.year,
      month:      budget.month,
      monthlyCap: budget.monthlyCap, // Return the saved monthly cap
      categories: budget.categories
    });
  } catch (error) {
    console.error('getBudget error:', error.message);
    res.status(500).json({ message: 'Server error fetching budget' });
  }
};

// POST /api/budget/:year/:month
// Body: { monthlyCap: 9000, categories: [{ category, emoji, limit }] }
// Overwrites the whole month — same pattern as frontend localStorage approach
export const saveBudget = async (req, res) => {
  try {
    const year  = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12)
      return res.status(400).json({ message: 'Invalid year or month' });

    // Extract monthlyCap alongside categories
    const { categories, monthlyCap } = req.body;

    if (!Array.isArray(categories))
      return res.status(400).json({ message: 'categories must be an array' });

    // Validate each category entry
    for (const cat of categories) {
      if (!cat.category || cat.limit === undefined || isNaN(cat.limit) || Number(cat.limit) < 0)
        return res.status(400).json({ message: 'Each category needs a name and a non-negative limit' });
    }

    const cleanCategories = categories.map(c => ({
      category: String(c.category).trim(),
      emoji:    c.emoji || '💰',
      limit:    Number(c.limit)
    }));

    // Upsert — create or overwrite
    const budget = await Budget.findOneAndUpdate(
      { user: req.user.id, year, month },
      { 
        $set: { 
          categories: cleanCategories,
          monthlyCap: Number(monthlyCap) || 0 // Save the monthly cap (default to 0 if invalid)
        } 
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      message:    'Budget saved successfully',
      year:       budget.year,
      month:      budget.month,
      monthlyCap: budget.monthlyCap, // Send it back in the confirmation
      categories: budget.categories
    });
  } catch (error) {
    console.error('saveBudget error:', error.message);
    res.status(500).json({ message: 'Server error saving budget' });
  }
};