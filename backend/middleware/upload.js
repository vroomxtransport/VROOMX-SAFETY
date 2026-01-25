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
    else if (req.body.category) folder = req.body.category;

    const uploadPath = path.join(process.cwd(), 'uploads', folder);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter - allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
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

// Helper to delete file
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath) return resolve(true);

    const fullPath = filePath.startsWith('/') ? path.join(process.cwd(), filePath) : filePath;

    fs.unlink(fullPath, (err) => {
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
