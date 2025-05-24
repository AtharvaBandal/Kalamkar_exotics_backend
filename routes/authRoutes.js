const express = require('express');
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/getProfile', protect, getProfile);
router.put('/updateProfile', protect, upload.single('profileImage'), updateProfile);

module.exports = router;