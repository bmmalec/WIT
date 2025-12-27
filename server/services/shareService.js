const LocationShare = require('../models/LocationShare');
const Location = require('../models/Location');
const User = require('../models/User');
const AppError = require('../utils/AppError');

class ShareService {
  /**
   * Invite a user to access a location
   * @param {ObjectId} inviterId - User sending the invite
   * @param {ObjectId} locationId - Location to share
   * @param {string} email - Invitee's email
   * @param {string} permission - Permission level
   * @param {boolean} inheritToChildren - Apply to child locations
   * @returns {Promise<Object>} Created share
   */
  async invite(inviterId, locationId, email, permission, inheritToChildren = true) {
    // Verify location exists and inviter owns it or has manager permission
    const location = await Location.findById(locationId);
    if (!location) {
      throw AppError.notFound('Location not found', 'LOCATION_NOT_FOUND');
    }

    // Check if inviter is owner or has manager permission
    const isOwner = location.ownerId.toString() === inviterId.toString();
    const hasManagerPermission = await LocationShare.hasAccess(inviterId, locationId, 'manager');

    if (!isOwner && !hasManagerPermission) {
      throw AppError.forbidden('You do not have permission to share this location', 'FORBIDDEN');
    }

    // Check if inviter is trying to invite themselves
    const inviter = await User.findById(inviterId);
    if (inviter.email.toLowerCase() === email.toLowerCase()) {
      throw AppError.badRequest('You cannot invite yourself', 'SELF_INVITE');
    }

    // Check if there's already a share for this email/location
    const existingShare = await LocationShare.findOne({
      locationId,
      email: email.toLowerCase(),
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingShare) {
      if (existingShare.status === 'accepted') {
        throw AppError.badRequest('This user already has access to this location', 'ALREADY_SHARED');
      }
      throw AppError.badRequest('An invitation is already pending for this email', 'INVITE_PENDING');
    }

    // Check if the invitee is the location owner
    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (invitee && location.ownerId.toString() === invitee._id.toString()) {
      throw AppError.badRequest('Cannot invite the location owner', 'OWNER_INVITE');
    }

    // Create the share with 7-day expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const share = new LocationShare({
      locationId,
      email: email.toLowerCase(),
      permission,
      inheritToChildren,
      invitedBy: inviterId,
      expiresAt,
    });

    await share.save();

    // Populate for response
    await share.populate('locationId', 'name type icon');
    await share.populate('invitedBy', 'name email');

    return share.toJSON();
  }

  /**
   * Get pending invites for an email
   * @param {string} email - User's email
   * @returns {Promise<Array>} Pending invites
   */
  async getPendingInvites(email) {
    return LocationShare.findPendingInvites(email);
  }

  /**
   * Get all shares for a location
   * @param {ObjectId} userId - Requesting user
   * @param {ObjectId} locationId - Location ID
   * @returns {Promise<Array>} Shares
   */
  async getSharesForLocation(userId, locationId) {
    // Verify location exists
    const location = await Location.findById(locationId);
    if (!location) {
      throw AppError.notFound('Location not found', 'LOCATION_NOT_FOUND');
    }

    // Check if user is owner or has manager permission
    const isOwner = location.ownerId.toString() === userId.toString();
    const hasManagerPermission = await LocationShare.hasAccess(userId, locationId, 'manager');

    if (!isOwner && !hasManagerPermission) {
      throw AppError.forbidden('You do not have permission to view shares', 'FORBIDDEN');
    }

    return LocationShare.findByLocation(locationId);
  }

  /**
   * Get locations shared with a user
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Array>} Shared locations
   */
  async getSharesForUser(userId) {
    return LocationShare.findByUser(userId);
  }

  /**
   * Accept an invitation
   * @param {ObjectId} userId - User accepting
   * @param {string} token - Invite token
   * @returns {Promise<Object>} Updated share
   */
  async acceptInvite(userId, token) {
    const share = await LocationShare.findOne({
      inviteToken: token,
      status: 'pending',
    });

    if (!share) {
      throw AppError.notFound('Invitation not found or already processed', 'INVITE_NOT_FOUND');
    }

    if (share.isExpired()) {
      throw AppError.badRequest('This invitation has expired', 'INVITE_EXPIRED');
    }

    // Verify the user's email matches the invite
    const user = await User.findById(userId);
    if (user.email.toLowerCase() !== share.email.toLowerCase()) {
      throw AppError.forbidden('This invitation was sent to a different email', 'EMAIL_MISMATCH');
    }

    await share.accept(userId);

    await share.populate('locationId', 'name type icon');
    await share.populate('invitedBy', 'name email');

    return share.toJSON();
  }

  /**
   * Decline an invitation
   * @param {ObjectId} userId - User declining
   * @param {string} token - Invite token
   * @returns {Promise<void>}
   */
  async declineInvite(userId, token) {
    const share = await LocationShare.findOne({
      inviteToken: token,
      status: 'pending',
    });

    if (!share) {
      throw AppError.notFound('Invitation not found or already processed', 'INVITE_NOT_FOUND');
    }

    // Verify the user's email matches the invite
    const user = await User.findById(userId);
    if (user.email.toLowerCase() !== share.email.toLowerCase()) {
      throw AppError.forbidden('This invitation was sent to a different email', 'EMAIL_MISMATCH');
    }

    await share.decline();
  }

  /**
   * Revoke a share
   * @param {ObjectId} userId - User revoking
   * @param {ObjectId} shareId - Share ID
   * @returns {Promise<void>}
   */
  async revokeShare(userId, shareId) {
    const share = await LocationShare.findById(shareId);

    if (!share) {
      throw AppError.notFound('Share not found', 'SHARE_NOT_FOUND');
    }

    // Get the location to check permissions
    const location = await Location.findById(share.locationId);
    if (!location) {
      throw AppError.notFound('Location not found', 'LOCATION_NOT_FOUND');
    }

    // Check if user is owner or has manager permission
    const isOwner = location.ownerId.toString() === userId.toString();
    const hasManagerPermission = await LocationShare.hasAccess(userId, share.locationId, 'manager');

    if (!isOwner && !hasManagerPermission) {
      throw AppError.forbidden('You do not have permission to revoke this share', 'FORBIDDEN');
    }

    await share.revoke();
  }

  /**
   * Leave a shared location (user removes their own access)
   * @param {ObjectId} userId - User leaving
   * @param {ObjectId} shareId - Share ID
   * @returns {Promise<void>}
   */
  async leaveShare(userId, shareId) {
    const share = await LocationShare.findById(shareId);

    if (!share) {
      throw AppError.notFound('Share not found', 'SHARE_NOT_FOUND');
    }

    // Verify this share belongs to the requesting user
    if (!share.userId || share.userId.toString() !== userId.toString()) {
      throw AppError.forbidden('You can only leave shares that belong to you', 'FORBIDDEN');
    }

    // Cannot leave if not accepted
    if (share.status !== 'accepted') {
      throw AppError.badRequest('You can only leave active shares', 'INVALID_STATUS');
    }

    // Mark as revoked (user left)
    share.status = 'revoked';
    share.revokedAt = new Date();
    await share.save();
  }

  /**
   * Update share permission
   * @param {ObjectId} userId - User updating
   * @param {ObjectId} shareId - Share ID
   * @param {string} permission - New permission level
   * @returns {Promise<Object>} Updated share
   */
  async updatePermission(userId, shareId, permission) {
    const share = await LocationShare.findById(shareId);

    if (!share) {
      throw AppError.notFound('Share not found', 'SHARE_NOT_FOUND');
    }

    // Get the location to check permissions
    const location = await Location.findById(share.locationId);
    if (!location) {
      throw AppError.notFound('Location not found', 'LOCATION_NOT_FOUND');
    }

    // Check if user is owner or has manager permission
    const isOwner = location.ownerId.toString() === userId.toString();
    const hasManagerPermission = await LocationShare.hasAccess(userId, share.locationId, 'manager');

    if (!isOwner && !hasManagerPermission) {
      throw AppError.forbidden('You do not have permission to update this share', 'FORBIDDEN');
    }

    share.permission = permission;
    await share.save();

    await share.populate('userId', 'name email avatar');
    await share.populate('invitedBy', 'name email');

    return share.toJSON();
  }
}

module.exports = new ShareService();
