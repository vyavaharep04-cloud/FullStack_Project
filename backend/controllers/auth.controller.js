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

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const memberSince = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      userId: generateUserId(),
      memberSince
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id:          user._id,
        userId:      user.userId,
        name:        user.name,
        email:       user.email,
        memberSince: user.memberSince,
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

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id:          user._id,
        userId:      user.userId,
        name:        user.name,
        email:       user.email,
        memberSince: user.memberSince,
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