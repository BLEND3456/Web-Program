const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.patch('/profile', auth, authController.updateProfile);
router.patch('/profile/password', auth, authController.changePassword);

module.exports = router;