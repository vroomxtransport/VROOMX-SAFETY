const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const { Driver, Vehicle } = require('../models');
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/tickets
// @desc    Get all tickets with filtering
// @access  Private
router.get('/', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const { status, driverId, ticketType, startDate, endDate, page = 1, limit = 20, sort = '-ticketDate' } = req.query;

  const queryObj = { ...req.companyFilter };

  if (status) queryObj.status = status;
  if (driverId) queryObj.driverId = driverId;
  if (ticketType) queryObj.ticketType = ticketType;
  if (startDate || endDate) {
    queryObj.ticketDate = {};
    if (startDate) queryObj.ticketDate.$gte = new Date(startDate);
    if (endDate) queryObj.ticketDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const tickets = await Ticket.find(queryObj)
    .populate('driverId', 'firstName lastName employeeId')
    .populate('vehicleId', 'unitNumber')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Ticket.countDocuments(queryObj);

  res.json({
    success: true,
    count: tickets.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    tickets
  });
}));

// @route   GET /api/tickets/stats
// @desc    Get ticket statistics
// @access  Private
router.get('/stats', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  // Status breakdown
  const statusBreakdown = await Ticket.aggregate([
    { $match: { ...req.companyFilter } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Type breakdown
  const typeBreakdown = await Ticket.aggregate([
    { $match: { ...req.companyFilter } },
    { $group: { _id: '$ticketType', count: { $sum: 1 } } }
  ]);

  // Upcoming court dates (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const upcomingCourt = await Ticket.countDocuments({
    ...req.companyFilter,
    courtDate: { $gte: new Date(), $lte: thirtyDaysFromNow },
    courtDecision: 'not_yet'
  });

  // Financial totals
  const financials = await Ticket.aggregate([
    { $match: { ...req.companyFilter } },
    {
      $group: {
        _id: null,
        totalFines: { $sum: '$fineAmount' },
        totalPaid: { $sum: { $cond: ['$finePaid', '$fineAmount', 0] } },
        totalOutstanding: { $sum: { $cond: ['$finePaid', 0, '$fineAmount'] } },
        totalPoints: { $sum: '$points' }
      }
    }
  ]);

  // Open tickets count
  const openTickets = await Ticket.countDocuments({
    ...req.companyFilter,
    status: { $in: ['open', 'pending_court', 'fighting'] }
  });

  res.json({
    success: true,
    stats: {
      byStatus: statusBreakdown,
      byType: typeBreakdown,
      upcomingCourtDates: upcomingCourt,
      openTickets,
      financials: financials[0] || { totalFines: 0, totalPaid: 0, totalOutstanding: 0, totalPoints: 0 }
    }
  });
}));

// @route   GET /api/tickets/upcoming-court
// @desc    Get tickets with upcoming court dates
// @access  Private
router.get('/upcoming-court', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({
    ...req.companyFilter,
    courtDate: { $gte: new Date() },
    courtDecision: 'not_yet'
  })
    .populate('driverId', 'firstName lastName employeeId')
    .sort('courtDate')
    .limit(10);

  res.json({
    success: true,
    tickets
  });
}));

// @route   GET /api/tickets/:id
// @desc    Get single ticket
// @access  Private
router.get('/:id', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({
    _id: req.params.id,
    ...req.companyFilter
  })
    .populate('driverId', 'firstName lastName employeeId email phone')
    .populate('vehicleId', 'unitNumber vin make model')
    .populate('createdBy', 'firstName lastName')
    .populate('lastUpdatedBy', 'firstName lastName')
    .populate('internalNotes.createdBy', 'firstName lastName');

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  res.json({
    success: true,
    ticket
  });
}));

// @route   POST /api/tickets
// @desc    Create new ticket
// @access  Private
router.post('/', checkPermission('violations', 'edit'), [
  body('driverId').isMongoId().withMessage('Valid driver is required'),
  body('ticketDate').isISO8601().withMessage('Valid ticket date is required'),
  body('description').trim().notEmpty().withMessage('Description is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Verify driver belongs to company
  const driver = await Driver.findOne({
    _id: req.body.driverId,
    companyId: req.user.companyId._id || req.user.companyId
  });

  if (!driver) {
    throw new AppError('Driver not found or does not belong to your company', 404);
  }

  const ticket = await Ticket.create({
    ...req.body,
    companyId: req.user.companyId._id || req.user.companyId,
    createdBy: req.user._id
  });

  await ticket.populate('driverId', 'firstName lastName employeeId');

  auditService.log(req, 'create', 'ticket', ticket._id, { driverId: req.body.driverId, description: req.body.description?.substring(0, 100) });

  res.status(201).json({
    success: true,
    ticket
  });
}));

// @route   PUT /api/tickets/:id
// @desc    Update ticket
// @access  Private
router.put('/:id', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  let ticket = await Ticket.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  // Remove fields that shouldn't be updated directly
  delete req.body.companyId;
  delete req.body.createdBy;

  req.body.lastUpdatedBy = req.user._id;

  ticket = await Ticket.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('driverId', 'firstName lastName employeeId');

  auditService.log(req, 'update', 'ticket', req.params.id, { summary: 'Ticket updated' });

  res.json({
    success: true,
    ticket
  });
}));

// @route   POST /api/tickets/:id/notes
// @desc    Add internal note to ticket
// @access  Private
router.post('/:id/notes', checkPermission('violations', 'edit'), [
  body('content').trim().notEmpty().withMessage('Note content is required')
], asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  ticket.internalNotes.push({
    content: req.body.content,
    createdBy: req.user._id
  });

  ticket.lastUpdatedBy = req.user._id;
  await ticket.save();

  await ticket.populate('internalNotes.createdBy', 'firstName lastName');

  res.json({
    success: true,
    notes: ticket.internalNotes
  });
}));

// @route   PUT /api/tickets/:id/court-decision
// @desc    Update court decision
// @access  Private
router.put('/:id/court-decision', checkPermission('violations', 'edit'), [
  body('courtDecision').isIn(['not_yet', 'guilty', 'not_guilty', 'reduced', 'dismissed', 'deferred'])
], asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  ticket.courtDecision = req.body.courtDecision;
  ticket.courtNotes = req.body.courtNotes;
  ticket.lastUpdatedBy = req.user._id;

  // Update status based on decision
  if (req.body.courtDecision === 'dismissed' || req.body.courtDecision === 'not_guilty') {
    ticket.status = 'dismissed';
    ticket.pointsOnRecord = false;
  } else if (req.body.courtDecision === 'guilty') {
    ticket.status = 'paid';
    ticket.pointsOnRecord = true;
  } else if (req.body.courtDecision === 'reduced') {
    ticket.status = 'points_reduced';
    ticket.pointsReduced = req.body.pointsReduced;
    ticket.fineReduced = req.body.fineReduced;
  } else if (req.body.courtDecision === 'deferred') {
    ticket.status = 'deferred';
  }

  await ticket.save();

  auditService.log(req, 'update', 'ticket', req.params.id, { courtDecision: req.body.courtDecision });

  res.json({
    success: true,
    ticket
  });
}));

// @route   PUT /api/tickets/:id/payment
// @desc    Record payment for ticket
// @access  Private
router.put('/:id/payment', checkPermission('violations', 'edit'), asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  ticket.finePaid = true;
  ticket.paymentDate = req.body.paymentDate || new Date();
  ticket.paymentMethod = req.body.paymentMethod;

  if (ticket.status === 'open' || ticket.status === 'pending_court') {
    ticket.status = 'paid';
  }

  ticket.lastUpdatedBy = req.user._id;
  await ticket.save();

  auditService.log(req, 'update', 'ticket', req.params.id, { summary: 'Payment recorded' });

  res.json({
    success: true,
    message: 'Payment recorded successfully',
    ticket
  });
}));

// @route   DELETE /api/tickets/:id
// @desc    Delete ticket
// @access  Private
router.delete('/:id', checkPermission('violations', 'delete'), asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({
    _id: req.params.id,
    ...req.companyFilter
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  await ticket.deleteOne();

  auditService.log(req, 'delete', 'ticket', req.params.id, { summary: 'Ticket deleted' });

  res.json({
    success: true,
    message: 'Ticket deleted successfully'
  });
}));

module.exports = router;
