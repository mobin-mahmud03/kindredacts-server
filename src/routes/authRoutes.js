const express = require('express');
const router = express.Router();
const { register, login, socialLogin, updateProfile } = require('../controllers/authController');
const { verifyJWT } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.put('/profile', verifyJWT, updateProfile); // Optional Task 2: Profile update

module.exports = router;
