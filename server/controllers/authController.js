const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

// Cookie options for JWT token
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  const user = await authService.register(email, password, name);

  // Generate token and set cookie
  const token = await generateTokenForUser(user._id);
  res.cookie('token', token, getCookieOptions());

  res.status(201).json({
    success: true,
    data: { user },
    message: 'Registration successful',
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, token } = await authService.login(email, password);

  // Set cookie
  res.cookie('token', token, getCookieOptions());

  res.status(200).json({
    success: true,
    data: { user },
    message: 'Login successful',
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Public
 */
exports.logout = asyncHandler(async (req, res) => {
  // Clear the token cookie
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getById(req.user._id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
exports.updateMe = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;

  const user = await authService.updateProfile(req.user._id, { name, avatar });

  res.status(200).json({
    success: true,
    data: { user },
    message: 'Profile updated',
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/me/password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(req.user._id, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * @desc    Update user settings
 * @route   PUT /api/auth/me/settings
 * @access  Private
 */
exports.updateSettings = asyncHandler(async (req, res) => {
  const { theme, defaultView, notifications } = req.body;

  const user = await authService.updateSettings(req.user._id, {
    theme,
    defaultView,
    notifications,
  });

  res.status(200).json({
    success: true,
    data: { user },
    message: 'Settings updated',
  });
});

// Helper to generate token for a user ID
async function generateTokenForUser(userId) {
  const User = require('../models/User');
  const user = await User.findById(userId);
  return user.generateAuthToken();
}
