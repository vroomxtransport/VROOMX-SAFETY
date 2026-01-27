const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/documents',
    'uploads/drivers',
    'uploads/vehicles',
    'uploads/violations',
    'uploads/drug-alcohol',
    'uploads/accidents',
    'uploads/maintenance',
    'uploads/temp'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createUploadDirs();

// Whitelist of allowed upload categories to prevent path traversal
const ALLOWED_UPLOAD_FOLDERS = [
  'documents', 'drivers', 'vehicles', 'violations',
  'drug-alcohol', 'accidents', 'maintenance', 'temp'
];

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine folder based on route or specified category
    let folder = 'documents';

    if (req.baseUrl.includes('drivers')) folder = 'drivers';
    else if (req.baseUrl.includes('vehicles')) folder = 'vehicles';
    else if (req.baseUrl.includes('violations')) folder = 'violations';
    else if (req.baseUrl.includes('drug-alcohol')) folder = 'drug-alcohol';
    else if (req.baseUrl.includes('accidents')) folder = 'accidents';
    else if (req.baseUrl.includes('maintenance')) folder = 'maintenance';
    else if (req.body.category && ALLOWED_UPLOAD_FOLDERS.includes(req.body.category)) {
      folder = req.body.category;
    }
    // Ignore user-supplied category if not in whitelist (prevents path traversal)

    const uploadPath = path.join(process.cwd(), 'uploads', folder);

    // Verify the resolved path is within the uploads directory
    const uploadsBase = path.resolve(path.join(process.cwd(), 'uploads'));
    const resolvedPath = path.resolve(uploadPath);
    if (!resolvedPath.startsWith(uploadsBase)) {
      return cb(new Error('Invalid upload path'));
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter - allowed types (require BOTH mime and extension match)
const MIME_TO_EXT = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Reject filenames with path traversal attempts
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return cb(new Error('Invalid filename'), false);
  }

  // Require BOTH valid mime type AND matching extension
  const allowedExts = MIME_TO_EXT[file.mimetype];
  if (!allowedExts || !allowedExts.includes(ext)) {
    return cb(new Error('File type not allowed. Allowed: .pdf, .jpg, .jpeg, .png, .doc, .docx, .xls, .xlsx'), false);
  }

  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'file') => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 10MB'
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// Middleware for multiple file upload
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 10MB per file'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum is ${maxCount} files`
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// Helper to get file URL
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  // Convert absolute path to relative URL
  const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
  return relativePath;
};

// Helper to delete file (with path traversal protection)
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath) return resolve(true);

    const fullPath = filePath.startsWith('/') ? path.join(process.cwd(), filePath) : filePath;
    const resolvedPath = path.resolve(fullPath);
    const uploadsBase = path.resolve(path.join(process.cwd(), 'uploads'));

    // Prevent deletion of files outside uploads directory
    if (!resolvedPath.startsWith(uploadsBase)) {
      return reject(new Error('Cannot delete files outside uploads directory'));
    }

    fs.unlink(resolvedPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  getFileUrl,
  deleteFile
};
