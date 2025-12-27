const User = require('../models/User');
const AppError = require('../utils/AppError');

class AuthService {
  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @param {string} name - User display name
   * @returns {Promise<Object>} User object (without password)
   */
  async register(email, password, name) {
    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw AppError.conflict('Email already registered', 'DUPLICATE_EMAIL');
    }

    // Create user (password will be hashed by pre-save hook)
    const user = new User({
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      name,
    });

    await user.save();

    // Return user without sensitive fields (handled by toJSON transform)
    return user.toJSON();
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object>} User object with token
   */
  async login(email, password) {
    // Find user with password field
    const user = await User.findByEmailWithPassword(email);

    if (!user) {
      throw AppError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Check if account is locked
    if (user.isLocked()) {
      throw AppError.accountLocked('Account is locked. Try again later.');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      throw AppError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate token
    const token = user.generateAuthToken();

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getById(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    return user.toJSON();
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update (name, avatar)
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updates) {
    const allowedUpdates = ['name', 'avatar'];
    const filteredUpdates = {};

    // Filter to only allowed fields
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    return user.toJSON();
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw AppError.unauthorized('Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Update password (will be hashed by pre-save hook)
    user.passwordHash = newPassword;
    await user.save();
  }

  /**
   * Update user settings
   * @param {string} userId - User ID
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated user
   */
  async updateSettings(userId, settings) {
    const allowedSettings = ['theme', 'defaultView', 'notifications'];
    const updates = {};

    // Filter and prefix with 'settings.'
    for (const key of allowedSettings) {
      if (settings[key] !== undefined) {
        updates[`settings.${key}`] = settings[key];
      }
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    return user.toJSON();
  }
}

module.exports = new AuthService();
