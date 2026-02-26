const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

// Whitelisted subdirectories (mirrors upload.js ALLOWED_UPLOAD_FOLDERS)
const ALLOWED_FOLDERS = [
  'documents', 'drivers', 'vehicles', 'violations',
  'drug-alcohol', 'accidents', 'maintenance', 'logos', 'temp'
];

// MIME types by extension
const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

// GET /api/files/uploads/:folder/:filename
// Authenticated file serving - requires JWT
router.get('/uploads/*', protect, (req, res) => {
  const relativePath = req.params[0]; // everything after /uploads/

  if (!relativePath) {
    return res.status(400).json({ success: false, message: 'No file path specified' });
  }

  // Validate the first path segment is an allowed folder
  const folder = relativePath.split('/')[0];
  if (!ALLOWED_FOLDERS.includes(folder)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // Resolve absolute path and verify it's within uploads directory
  const uploadsBase = path.resolve(path.join(process.cwd(), 'uploads'));
  const filePath = path.resolve(path.join(uploadsBase, relativePath));

  if (!filePath.startsWith(uploadsBase + path.sep)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // Check file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  // Set content type based on extension
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', 'inline');

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    res.status(500).json({ success: false, message: 'Error reading file' });
  });
  stream.pipe(res);
});

module.exports = router;
