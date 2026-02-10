const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const ViolationCode = require('../models/ViolationCode');

router.use(protect);

// GET /api/violation-codes/search - Search violation codes
router.get('/search', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json({ success: true, codes: [] });
  }
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const codes = await ViolationCode.find({
    $or: [
      { code: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } }
    ]
  }).limit(20).lean();
  res.json({ success: true, codes });
}));

// GET /api/violation-codes/:code - Get single code
router.get('/:code', asyncHandler(async (req, res) => {
  const code = await ViolationCode.findOne({ code: req.params.code }).lean();
  if (!code) {
    throw new AppError('Violation code not found', 404);
  }
  res.json({ success: true, code });
}));

// POST /api/violation-codes/seed - Bulk seed violation codes (admin only)
router.post('/seed', authorize('owner', 'admin'), asyncHandler(async (req, res) => {
  const violationCodeData = require('../config/violationCodeData');
  const ops = violationCodeData.map(vc => ({
    updateOne: {
      filter: { code: vc.code },
      update: { $set: { ...vc, lastUpdated: new Date() } },
      upsert: true
    }
  }));
  const result = await ViolationCode.bulkWrite(ops);
  res.json({
    success: true,
    message: `Seeded ${violationCodeData.length} violation codes`,
    upserted: result.upsertedCount,
    modified: result.modifiedCount
  });
}));

module.exports = router;
