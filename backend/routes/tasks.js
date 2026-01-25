const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { protect, restrictToCompany, checkPermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Apply authentication to all routes
router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/tasks
// @desc    Get all tasks with filtering and pagination
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const {
    status,
    priority,
    assignedTo,
    linkedType,
    linkedId,
    dueBefore,
    dueAfter,
    search,
    page = 1,
    limit = 20,
    sort = '-dueDate'
  } = req.query;

  const query = { companyId: req.companyFilter.companyId };

  // Apply filters
  if (status) {
    if (status === 'active') {
      query.status = { $in: ['not_started', 'in_progress', 'overdue'] };
    } else {
      query.status = status;
    }
  }
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (linkedType) query['linkedTo.type'] = linkedType;
  if (linkedId) query['linkedTo.refId'] = linkedId;

  if (dueBefore) query.dueDate = { ...query.dueDate, $lte: new Date(dueBefore) };
  if (dueAfter) query.dueDate = { ...query.dueDate, $gte: new Date(dueAfter) };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('completedBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Task.countDocuments(query)
  ]);

  res.json({
    success: true,
    count: tasks.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    tasks
  });
}));

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;

  const stats = await Task.aggregate([
    { $match: { companyId: companyId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        notStarted: { $sum: { $cond: [{ $eq: ['$status', 'not_started'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        overdue: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
      }
    }
  ]);

  // Get tasks due this week
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const dueThisWeek = await Task.countDocuments({
    companyId,
    status: { $ne: 'completed' },
    dueDate: { $gte: now, $lte: weekFromNow }
  });

  // Get overdue count
  const overdueCount = await Task.countDocuments({
    companyId,
    status: { $ne: 'completed' },
    dueDate: { $lt: now }
  });

  res.json({
    success: true,
    stats: {
      ...stats[0] || { total: 0, notStarted: 0, inProgress: 0, completed: 0, overdue: 0, highPriority: 0 },
      dueThisWeek,
      overdueCount
    }
  });
}));

// @route   GET /api/tasks/overdue
// @desc    Get overdue tasks
// @access  Private
router.get('/overdue', asyncHandler(async (req, res) => {
  const tasks = await Task.find({
    companyId: req.companyFilter.companyId,
    status: { $ne: 'completed' },
    dueDate: { $lt: new Date() }
  })
    .populate('assignedTo', 'firstName lastName email')
    .sort('dueDate')
    .limit(50);

  res.json({
    success: true,
    count: tasks.length,
    tasks
  });
}));

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  })
    .populate('assignedTo', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName')
    .populate('completedBy', 'firstName lastName')
    .populate('notes.createdBy', 'firstName lastName');

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  res.json({ success: true, task });
}));

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('assignedToType').optional().isIn(['driver', 'staff', 'admin'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const taskData = {
    ...req.body,
    companyId: req.companyFilter.companyId,
    createdBy: req.user._id
  };

  const task = await Task.create(taskData);

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    task: populatedTask
  });
}));

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', asyncHandler(async (req, res) => {
  let task = await Task.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  // Don't allow changing completed tasks (except to reopen)
  if (task.status === 'completed' && req.body.status !== 'not_started' && req.body.status !== 'in_progress') {
    // Allow updating other fields on completed tasks
  }

  req.body.lastUpdatedBy = req.user._id;

  task = await Task.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('assignedTo', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName')
    .populate('completedBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Task updated successfully',
    task
  });
}));

// @route   PATCH /api/tasks/:id/complete
// @desc    Mark task as completed
// @access  Private
router.patch('/:id/complete', asyncHandler(async (req, res) => {
  let task = await Task.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.status = 'completed';
  task.completedBy = req.user._id;
  task.completedAt = new Date();
  task.completionNotes = req.body.notes || '';
  task.lastUpdatedBy = req.user._id;

  await task.save();

  // If recurring, create next instance
  if (task.recurring.enabled && task.recurring.intervalDays) {
    await Task.createRecurringInstance(task);
  }

  task = await Task.findById(task._id)
    .populate('assignedTo', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName')
    .populate('completedBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Task completed successfully',
    task
  });
}));

// @route   PATCH /api/tasks/:id/reopen
// @desc    Reopen a completed task
// @access  Private
router.patch('/:id/reopen', asyncHandler(async (req, res) => {
  let task = await Task.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.status = 'in_progress';
  task.completedBy = null;
  task.completedAt = null;
  task.lastUpdatedBy = req.user._id;

  await task.save();

  res.json({
    success: true,
    message: 'Task reopened successfully',
    task
  });
}));

// @route   POST /api/tasks/:id/notes
// @desc    Add note to task
// @access  Private
router.post('/:id/notes', [
  body('content').trim().notEmpty().withMessage('Note content is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const task = await Task.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.notes.push({
    content: req.body.content,
    createdBy: req.user._id
  });
  task.lastUpdatedBy = req.user._id;

  await task.save();

  const updatedTask = await Task.findById(task._id)
    .populate('notes.createdBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Note added successfully',
    notes: updatedTask.notes
  });
}));

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    companyId: req.companyFilter.companyId
  });

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  await Task.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
}));

module.exports = router;
