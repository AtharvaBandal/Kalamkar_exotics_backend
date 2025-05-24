const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to create JWT token
const createToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

// Register user
exports.register = async (req, res) => {
  try {
    const user = await User.create(req.body);
    const token = createToken(user);
    res.status(201).json({ token, user: { username: user.username } });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = createToken(user);
    res.json({ token, user: { username: user.username } });
  } catch (err) {
    res.status(400).json({ error: 'Login failed' });
  }
};

// Logout user (usually just frontend clears token)
exports.logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};

// Get profile of logged-in user
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Select only username, address, and profileImage
    const user = await User.findById(req.user._id).select('username address profileImage');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Upload profile image (just multer handler)
exports.uploadProfileImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return just the filename
  res.json({ imagePath: req.file.filename });
};

// Update profile (address + profileImage filename or new upload)
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { address, profileImage } = req.body;
    const updateData = { address };

    // If multer saved a new file, use its filename
    if (req.file) {
      updateData.profileImage = req.file.filename;
    } else if (profileImage) {
      // Otherwise use the filename string sent from client
      updateData.profileImage = profileImage;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      {
        new: true,
        runValidators: true,
        select: 'username address profileImage',
      }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(400).json({ error: 'Failed to update profile' });
  }
};