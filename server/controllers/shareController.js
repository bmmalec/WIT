const shareService = require('../services/shareService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Invite a user to access a location
 * @route   POST /api/locations/:id/share
 * @access  Private (Owner or Manager)
 */
exports.invite = asyncHandler(async (req, res) => {
  const { email, permission, inheritToChildren } = req.body;

  const share = await shareService.invite(
    req.user._id,
    req.params.id,
    email,
    permission,
    inheritToChildren
  );

  res.status(201).json({
    success: true,
    data: { share },
    message: 'Invitation sent successfully',
  });
});

/**
 * @desc    Get all shares for a location
 * @route   GET /api/locations/:id/shares
 * @access  Private (Owner or Manager)
 */
exports.getShares = asyncHandler(async (req, res) => {
  const shares = await shareService.getSharesForLocation(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    data: { shares },
    count: shares.length,
  });
});

/**
 * @desc    Get pending invites for current user
 * @route   GET /api/shares/pending
 * @access  Private
 */
exports.getPendingInvites = asyncHandler(async (req, res) => {
  const invites = await shareService.getPendingInvites(req.user.email);

  res.status(200).json({
    success: true,
    data: { invites },
    count: invites.length,
  });
});

/**
 * @desc    Get locations shared with current user
 * @route   GET /api/shares
 * @access  Private
 */
exports.getMyShares = asyncHandler(async (req, res) => {
  const shares = await shareService.getSharesForUser(req.user._id);

  res.status(200).json({
    success: true,
    data: { shares },
    count: shares.length,
  });
});

/**
 * @desc    Accept an invitation
 * @route   POST /api/shares/accept/:token
 * @access  Private
 */
exports.acceptInvite = asyncHandler(async (req, res) => {
  const share = await shareService.acceptInvite(req.user._id, req.params.token);

  res.status(200).json({
    success: true,
    data: { share },
    message: 'Invitation accepted',
  });
});

/**
 * @desc    Decline an invitation
 * @route   POST /api/shares/decline/:token
 * @access  Private
 */
exports.declineInvite = asyncHandler(async (req, res) => {
  await shareService.declineInvite(req.user._id, req.params.token);

  res.status(200).json({
    success: true,
    message: 'Invitation declined',
  });
});

/**
 * @desc    Revoke a share
 * @route   DELETE /api/shares/:id
 * @access  Private (Owner or Manager)
 */
exports.revokeShare = asyncHandler(async (req, res) => {
  await shareService.revokeShare(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Share revoked',
  });
});

/**
 * @desc    Update share permission
 * @route   PUT /api/shares/:id
 * @access  Private (Owner or Manager)
 */
exports.updateShare = asyncHandler(async (req, res) => {
  const { permission } = req.body;

  const share = await shareService.updatePermission(req.user._id, req.params.id, permission);

  res.status(200).json({
    success: true,
    data: { share },
    message: 'Permission updated',
  });
});

/**
 * @desc    Leave a shared location (user removes their own access)
 * @route   POST /api/shares/:id/leave
 * @access  Private
 */
exports.leaveShare = asyncHandler(async (req, res) => {
  await shareService.leaveShare(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'You have left the shared location',
  });
});
