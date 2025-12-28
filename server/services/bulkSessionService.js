const BulkSession = require('../models/BulkSession');
const Item = require('../models/Item');
const Location = require('../models/Location');
const AppError = require('../utils/AppError');
const permissionService = require('./permissionService');

class BulkSessionService {
  /**
   * Start a new bulk import session
   * @param {ObjectId} userId - User starting the session
   * @param {Object} data - Session configuration
   * @param {ObjectId} data.targetLocationId - Initial target location
   * @param {ObjectId} data.defaultCategoryId - Optional default category
   * @param {String} data.name - Optional session name
   * @returns {Promise<Object>} Created session
   */
  async startSession(userId, data) {
    // Check if user already has an active session
    const existingSession = await BulkSession.getActiveSession(userId);
    if (existingSession) {
      throw AppError.badRequest(
        'You already have an active bulk import session. Please complete or cancel it first.',
        'SESSION_EXISTS'
      );
    }

    // Verify target location exists and user has access
    const location = await Location.findById(data.targetLocationId);
    if (!location) {
      throw AppError.notFound('Target location not found', 'LOCATION_NOT_FOUND');
    }

    // Check permission (need at least contributor to add items)
    const hasAccess = await permissionService.canAccessLocation(
      userId,
      data.targetLocationId,
      'contributor'
    );
    if (!hasAccess) {
      throw AppError.forbidden(
        'You do not have permission to add items to this location',
        'FORBIDDEN'
      );
    }

    // Create session
    const session = new BulkSession({
      userId,
      targetLocationId: data.targetLocationId,
      defaultCategoryId: data.defaultCategoryId || null,
      name: data.name || `Bulk Import ${new Date().toLocaleDateString()}`,
      status: 'active',
      startedAt: new Date(),
    });

    await session.save();

    // Populate for response
    await session.populate('targetLocationId', 'name icon type');
    await session.populate('defaultCategoryId', 'name icon color');

    return session.toJSON();
  }

  /**
   * Get active or paused session for user (resumable session)
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Object|null>} Active/paused session or null
   */
  async getActiveSession(userId) {
    const session = await BulkSession.getResumableSession(userId);
    if (session) {
      await session.populate('pendingItems.locationId', 'name icon type');
      await session.populate('pendingItems.categoryId', 'name icon color');
    }
    return session ? session.toJSON() : null;
  }

  /**
   * Get session by ID
   * @param {ObjectId} userId - Requesting user
   * @param {ObjectId} sessionId - Session ID
   * @returns {Promise<Object>} Session
   */
  async getById(userId, sessionId) {
    const session = await BulkSession.findById(sessionId)
      .populate('targetLocationId', 'name icon type')
      .populate('defaultCategoryId', 'name icon color')
      .populate('pendingItems.locationId', 'name icon type')
      .populate('pendingItems.categoryId', 'name icon color');

    if (!session) {
      throw AppError.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    // Verify ownership
    if (session.userId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have access to this session', 'FORBIDDEN');
    }

    return session.toJSON();
  }

  /**
   * Change target location
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} sessionId - Session ID
   * @param {ObjectId} locationId - New target location
   * @returns {Promise<Object>} Updated session
   */
  async changeTargetLocation(userId, sessionId, locationId) {
    const session = await BulkSession.findById(sessionId);

    if (!session) {
      throw AppError.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.userId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have access to this session', 'FORBIDDEN');
    }

    if (session.status !== 'active') {
      throw AppError.badRequest('Session is not active', 'SESSION_NOT_ACTIVE');
    }

    // Verify new location
    const location = await Location.findById(locationId);
    if (!location) {
      throw AppError.notFound('Location not found', 'LOCATION_NOT_FOUND');
    }

    // Check permission
    const hasAccess = await permissionService.canAccessLocation(userId, locationId, 'contributor');
    if (!hasAccess) {
      throw AppError.forbidden(
        'You do not have permission to add items to this location',
        'FORBIDDEN'
      );
    }

    session.changeTargetLocation(locationId);
    await session.save();

    await session.populate('targetLocationId', 'name icon type');
    await session.populate('defaultCategoryId', 'name icon color');

    return session.toJSON();
  }

  /**
   * Add a pending item to session
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} sessionId - Session ID
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>} Updated session with new item
   */
  async addPendingItem(userId, sessionId, itemData) {
    const session = await BulkSession.findById(sessionId);

    if (!session) {
      throw AppError.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.userId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have access to this session', 'FORBIDDEN');
    }

    if (session.status !== 'active') {
      throw AppError.badRequest('Session is not active', 'SESSION_NOT_ACTIVE');
    }

    const tempId = session.addPendingItem(itemData);
    await session.save();

    await session.populate('targetLocationId', 'name icon type');
    await session.populate('pendingItems.locationId', 'name icon type');
    await session.populate('pendingItems.categoryId', 'name icon color');

    return {
      session: session.toJSON(),
      addedItemId: tempId,
    };
  }

  /**
   * Update a pending item
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} sessionId - Session ID
   * @param {String} tempId - Temp ID of item to update
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated session
   */
  async updatePendingItem(userId, sessionId, tempId, updates) {
    const session = await BulkSession.findById(sessionId);

    if (!session) {
      throw AppError.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.userId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have access to this session', 'FORBIDDEN');
    }

    if (session.status !== 'active') {
      throw AppError.badRequest('Session is not active', 'SESSION_NOT_ACTIVE');
    }

    const updated = session.updatePendingItem(tempId, updates);
    if (!updated) {
      throw AppError.notFound('Pending item not found', 'ITEM_NOT_FOUND');
    }

    await session.save();

    await session.populate('targetLocationId', 'name icon type');
    await session.populate('pendingItems.locationId', 'name icon type');
    await session.populate('pendingItems.categoryId', 'name icon color');

    return session.toJSON();
  }

  /**
   * Remove a pending item (reject)
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} sessionId - Session ID
   * @param {String} tempId - Temp ID of item to remove
   * @returns {Promise<Object>} Updated session
   */
  async removePendingItem(userId, sessionId, tempId) {
    const session = await BulkSession.findById(sessionId);

    if (!session) {
      throw AppError.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.userId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have access to this session', 'FORBIDDEN');
    }

    if (session.status !== 'active') {
      throw AppError.badRequest('Session is not active', 'SESSION_NOT_ACTIVE');
    }

    const removed = session.removePendingItem(tempId);
    if (!removed) {
      throw AppError.notFound('Pending item not found', 'ITEM_NOT_FOUND');
    }

    await session.save();

    await session.populate('targetLocationId', 'name icon type');
    await session.populate('pendingItems.locationId', 'name icon type');
    await session.populate('pendingItems.categoryId', 'name icon color');

    return session.toJSON();
  }

  /**
   * Commit all pending items to inventory
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} sessionId - Session ID
   * @returns {Promise<Object>} Commit result
   */
  async commitSession(userId, sessionId) {
    const session = await BulkSession.findById(sessionId);

    if (!session) {
      throw AppError.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.userId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have access to this session', 'FORBIDDEN');
    }

    if (session.status !== 'active') {
      throw AppError.badRequest('Session is not active', 'SESSION_NOT_ACTIVE');
    }

    if (session.pendingItems.length === 0) {
      throw AppError.badRequest('No items to commit', 'NO_ITEMS');
    }

    // Create all items
    const createdItems = [];
    const errors = [];

    for (const pendingItem of session.pendingItems) {
      try {
        // Get location owner for item ownership
        const location = await Location.findById(pendingItem.locationId);
        if (!location) {
          errors.push({ tempId: pendingItem.tempId, error: 'Location not found' });
          continue;
        }

        const item = new Item({
          name: pendingItem.name,
          description: pendingItem.description,
          categoryId: pendingItem.categoryId,
          itemType: pendingItem.itemType,
          brand: pendingItem.brand,
          model: pendingItem.model,
          quantity: pendingItem.quantity,
          images: pendingItem.images,
          alternateNames: pendingItem.alternateNames,
          tags: pendingItem.tags,
          barcode: pendingItem.barcode,
          perishable: pendingItem.perishable,
          locationId: pendingItem.locationId,
          ownerId: location.ownerId,
        });

        await item.save();
        createdItems.push(item);
        session.stats.committed += 1;
      } catch (err) {
        console.error('Failed to create item:', pendingItem.tempId, err);
        errors.push({ tempId: pendingItem.tempId, error: err.message });
      }
    }

    // Complete session
    session.complete();
    session.pendingItems = []; // Clear pending items
    await session.save();

    return {
      success: true,
      committed: createdItems.length,
      errors: errors.length,
      errorDetails: errors,
      session: session.toJSON(),
    };
  }

  /**
   * Pause session
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} sessionId - Session ID
   * @returns {Promise<Object>} Paused session
   */
  async pauseSession(userId, sessionId) {
    const session = await BulkSession.findById(sessionId);

    if (!session) {
      throw AppError.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.userId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have access to this session', 'FORBIDDEN');
    }

    if (session.status !== 'active') {
      throw AppError.badRequest('Only active sessions can be paused', 'INVALID_STATUS');
    }

    session.pause();
    await session.save();

    await session.populate('targetLocationId', 'name icon type');
    await session.populate('defaultCategoryId', 'name icon color');

    return session.toJSON();
  }

  /**
   * Resume a paused session
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} sessionId - Session ID
   * @returns {Promise<Object>} Resumed session
   */
  async resumeSession(userId, sessionId) {
    const session = await BulkSession.findById(sessionId);

    if (!session) {
      throw AppError.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.userId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have access to this session', 'FORBIDDEN');
    }

    if (session.status !== 'paused') {
      throw AppError.badRequest('Only paused sessions can be resumed', 'INVALID_STATUS');
    }

    session.resume();
    await session.save();

    await session.populate('targetLocationId', 'name icon type');
    await session.populate('defaultCategoryId', 'name icon color');
    await session.populate('pendingItems.locationId', 'name icon type');
    await session.populate('pendingItems.categoryId', 'name icon color');

    return session.toJSON();
  }

  /**
   * Cancel session
   * @param {ObjectId} userId - User ID
   * @param {ObjectId} sessionId - Session ID
   * @returns {Promise<Object>} Cancelled session
   */
  async cancelSession(userId, sessionId) {
    const session = await BulkSession.findById(sessionId);

    if (!session) {
      throw AppError.notFound('Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.userId.toString() !== userId.toString()) {
      throw AppError.forbidden('You do not have access to this session', 'FORBIDDEN');
    }

    if (session.status !== 'active' && session.status !== 'paused') {
      throw AppError.badRequest('Session cannot be cancelled', 'INVALID_STATUS');
    }

    session.cancel();
    await session.save();

    return session.toJSON();
  }

  /**
   * Get user's session history
   * @param {ObjectId} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Session history
   */
  async getSessionHistory(userId, options = {}) {
    const limit = options.limit || 20;
    const skip = options.skip || 0;

    const sessions = await BulkSession.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('targetLocationId', 'name icon type')
      .lean();

    return sessions;
  }
}

module.exports = new BulkSessionService();
