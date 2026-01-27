const express = require('express');
const router = express.Router();
const FeatureFlag = require('../models/FeatureFlag');

// @route   GET /api/features/active
// @desc    Get enabled feature flag keys (public)
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const flags = await FeatureFlag.find({ enabled: true }).select('key').lean();
    const keys = flags.map(f => f.key);

    res.json({ success: true, features: keys });
  } catch (error) {
    console.error('Features active error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
