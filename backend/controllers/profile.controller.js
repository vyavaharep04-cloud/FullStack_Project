import User from '../models/User.js';

// GET /api/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id:                      user._id,
      userId:                  user.userId,
      name:                    user.name,
      email:                   user.email,
      phone:                   user.phone,
      memberSince:             user.memberSince,
      preferences:             user.preferences,
      customIncomeCategories:  user.customIncomeCategories,
      customExpenseCategories: user.customExpenseCategories
    });
  } catch (err) {
    console.error('getProfile error:', err.message);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// PUT /api/profile
// Accepts: name, phone, preferences, customIncomeCategories, customExpenseCategories
// Does NOT allow: email change, password change (separate flow), userId, memberSince
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, preferences, customIncomeCategories, customExpenseCategories } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '')
        return res.status(400).json({ message: 'name cannot be empty' });
      user.name = name.trim();
    }

    if (phone !== undefined) user.phone = String(phone).trim();

    if (preferences !== undefined) {
      if (typeof preferences !== 'object' || Array.isArray(preferences))
        return res.status(400).json({ message: 'preferences must be an object' });

      const allowed = ['defaultFilter', 'startingBalance', 'theme'];
      allowed.forEach(key => {
        if (preferences[key] !== undefined) user.preferences[key] = preferences[key];
      });
      user.markModified('preferences');   // needed for nested object change detection
    }

    if (customIncomeCategories !== undefined) {
      if (!Array.isArray(customIncomeCategories))
        return res.status(400).json({ message: 'customIncomeCategories must be an array' });
      user.customIncomeCategories = customIncomeCategories.map(c => String(c).trim()).filter(Boolean);
    }

    if (customExpenseCategories !== undefined) {
      if (!Array.isArray(customExpenseCategories))
        return res.status(400).json({ message: 'customExpenseCategories must be an array' });
      user.customExpenseCategories = customExpenseCategories.map(c => String(c).trim()).filter(Boolean);
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      profile: {
        id:                      user._id,
        userId:                  user.userId,
        name:                    user.name,
        email:                   user.email,
        phone:                   user.phone,
        memberSince:             user.memberSince,
        preferences:             user.preferences,
        customIncomeCategories:  user.customIncomeCategories,
        customExpenseCategories: user.customExpenseCategories
      }
    });
  } catch (err) {
    console.error('updateProfile error:', err.message);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};