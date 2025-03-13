const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * @route  POST /api/auth/login
 * @desc   Logowanie użytkownika
 * @access Public
 */
router.post('/login', AuthController.login);

/**
 * @route  POST /api/auth/logout
 * @desc   Wylogowanie użytkownika
 * @access Public
 */
router.post('/logout', AuthController.logout);

/**
 * @route  GET /api/auth/check-session
 * @desc   Sprawdzanie sesji użytkownika
 * @access Private
 */
router.get('/check-session', authenticate, AuthController.checkSession);

/**
 * @route  POST /api/auth/refresh-token
 * @desc   Odświeżanie tokenu JWT
 * @access Public
 */
router.post('/refresh-token', AuthController.refreshToken);

module.exports = router; 