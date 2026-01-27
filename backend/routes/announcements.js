const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// @route   GET /api/announcements/active
// @desc    Get active announcements (public)
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Announcements active error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
