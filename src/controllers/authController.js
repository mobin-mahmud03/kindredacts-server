const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDB, getFallbackStore } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasMinLength = password.length >= 6;
  return hasUpperCase && hasLowerCase && hasMinLength;
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// REGISTER
async function register(req, res) {
  try {
    const { name, email, photoURL, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must have at least one uppercase letter, one lowercase letter, and be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDB();

    if (db) {
      const usersCollection = db.collection('users');
      const existingUser = await usersCollection.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        name: name.trim(),
        email: normalizedEmail,
        photoURL: photoURL ? photoURL.trim() : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        password: hashedPassword,
        createdAt: new Date()
      };

      const result = await usersCollection.insertOne(newUser);
      const userPayload = {
        id: result.insertedId.toString(),
        name: newUser.name,
        email: newUser.email,
        photoURL: newUser.photoURL
      };

      const token = generateToken(userPayload);
      return res.status(201).json({
        success: true,
        message: 'Account registered successfully!',
        token,
        user: userPayload
      });
    } else {
      // Memory fallback
      const store = getFallbackStore();
      const existing = store.users.find(u => u.email === normalizedEmail);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: new ObjectId().toString(),
        name: name.trim(),
        email: normalizedEmail,
        photoURL: photoURL ? photoURL.trim() : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        password: hashedPassword,
        createdAt: new Date()
      };
      store.users.push(newUser);

      const userPayload = {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        photoURL: newUser.photoURL
      };
      const token = generateToken(userPayload);

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully!',
        token,
        user: userPayload
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while registering user.'
    });
  }
}

// LOGIN
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDB();

    let user = null;
    if (db) {
      const usersCollection = db.collection('users');
      user = await usersCollection.findOne({ email: normalizedEmail });
    } else {
      user = getFallbackStore().users.find(u => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const userPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    };
    const token = generateToken(userPayload);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while logging in.'
    });
  }
}

// SOCIAL LOGIN (Google / GitHub)
async function socialLogin(req, res) {
  try {
    const { name, email, photoURL } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for social login.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = getDB();

    let user = null;
    if (db) {
      const usersCollection = db.collection('users');
      user = await usersCollection.findOne({ email: normalizedEmail });
      if (!user) {
        const newUser = {
          name: name || 'Community Volunteer',
          email: normalizedEmail,
          photoURL: photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
          createdAt: new Date(),
          isSocialAuth: true
        };
        const result = await usersCollection.insertOne(newUser);
        user = { ...newUser, _id: result.insertedId };
      }
    } else {
      const store = getFallbackStore();
      user = store.users.find(u => u.email === normalizedEmail);
      if (!user) {
        user = {
          _id: new ObjectId().toString(),
          name: name || 'Community Volunteer',
          email: normalizedEmail,
          photoURL: photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
          createdAt: new Date(),
          isSocialAuth: true
        };
        store.users.push(user);
      }
    }

    const userPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      photoURL: user.photoURL
    };
    const token = generateToken(userPayload);

    return res.status(200).json({
      success: true,
      message: 'Social authentication successful!',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Social login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during social login.'
    });
  }
}

// UPDATE PROFILE (Optional Task 2)
async function updateProfile(req, res) {
  try {
    const { name, photoURL } = req.body;
    const userEmail = req.user.email;

    if (!name && !photoURL) {
      return res.status(400).json({
        success: false,
        message: 'Nothing to update.'
      });
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (photoURL) updateFields.photoURL = photoURL.trim();

    const db = getDB();
    if (db) {
      const usersCollection = db.collection('users');
      await usersCollection.updateOne({ email: userEmail }, { $set: updateFields });
      const updatedUser = await usersCollection.findOne({ email: userEmail });

      const userPayload = {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        photoURL: updatedUser.photoURL
      };
      const token = generateToken(userPayload);

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        token,
        user: userPayload
      });
    } else {
      const store = getFallbackStore();
      const user = store.users.find(u => u.email === userEmail);
      if (user) {
        if (name) user.name = name.trim();
        if (photoURL) user.photoURL = photoURL.trim();
        const userPayload = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          photoURL: user.photoURL
        };
        const token = generateToken(userPayload);
        return res.status(200).json({
          success: true,
          message: 'Profile updated successfully!',
          token,
          user: userPayload
        });
      }
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user profile.'
    });
  }
}

module.exports = {
  register,
  login,
  socialLogin,
  updateProfile
};
