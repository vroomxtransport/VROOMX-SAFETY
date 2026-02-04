# Phase 12: Report History - Research

**Researched:** 2026-02-04
**Domain:** Report generation tracking with file storage and retention management
**Confidence:** HIGH

## Summary

This phase implements report history tracking allowing users to view previously generated reports and re-download them within a 90-day retention window. The primary work involves: (1) creating a ReportHistory model to track each report generation with metadata (who, what, when, filters used), (2) storing generated report files in a dedicated `uploads/reports` directory, (3) implementing a cron job to clean up expired files after 90 days using MongoDB TTL indexes, and (4) building a frontend UI to list and re-download historical reports.

The codebase already has established patterns for this functionality: AuditLog model demonstrates company-scoped tracking with TTL indexes (2-year retention), Document model shows file storage with `filePath` references, and the existing download route pattern (`/api/documents/:id/download`) provides an authenticated file serving approach. The ReportHistory model combines these patterns - storing metadata in MongoDB with TTL-based cleanup while storing actual files on disk.

The key architectural decision is storing generated files rather than regenerating on demand. This is necessary because: (1) data changes over time - a report from 30 days ago should show data as it existed then, not current data; (2) filter parameters alone cannot reproduce exact output if underlying records were modified/deleted; (3) users expect instant re-downloads without waiting for report generation.

**Primary recommendation:** Create a ReportHistory model with TTL index (90 days), store generated files in `uploads/reports/{companyId}/`, and serve downloads through an authenticated endpoint following the existing Document download pattern.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mongoose | (existing) | ReportHistory model | Company-scoped tracking following AuditLog pattern |
| node-cron | (existing) | Orphan file cleanup | Already used for alert generation, scheduled reports |
| fs/path | (built-in) | File storage/serving | Existing Document model pattern for file management |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| uuid | (existing) | Unique file naming | Already used in upload middleware for collision-free names |
| date-fns | (existing) | Date formatting | Consistent date display in history list |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| File storage | Regenerate on demand | Regeneration cannot reproduce historical data state; would show current data |
| MongoDB TTL | Manual cron cleanup | TTL is atomic and handles edge cases; cron needs additional logic |
| Disk storage | MongoDB GridFS | Files are already disk-based in this codebase; GridFS adds complexity |
| 90-day TTL | Soft delete | TTL is simpler; 90 days is business requirement, not user decision |

**No new installations required** - all necessary libraries are already in the project.

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── models/
│   └── ReportHistory.js          # NEW: Report generation tracking
├── routes/
│   ├── reports.js                # MODIFY: Track generation, add history endpoints
│   └── reportHistory.js          # NEW: List/download historical reports
├── services/
│   └── reportHistoryService.js   # NEW: File management, cleanup
├── cron/
│   └── reportHistoryCleanup.js   # NEW: Orphan file cleanup (backup to TTL)

frontend/src/
├── components/
│   └── reports/
│       └── ReportHistoryList.jsx # NEW: Historical reports table
├── pages/
│   └── ReportHistory.jsx         # NEW: Report history page
├── utils/
│   └── api.js                    # MODIFY: Add reportHistoryAPI
```

### Pattern 1: ReportHistory Model (Following AuditLog Pattern)
**What:** Company-scoped model tracking each report generation with file reference and TTL
**When to use:** Storing report generation metadata
**Example:**
```javascript
// backend/models/ReportHistory.js
const mongoose = require('mongoose');

const reportHistorySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedByEmail: {
    type: String,
    required: true
  },
  reportType: {
    type: String,
    required: true,
    enum: ['dqf', 'vehicle', 'violations', 'audit', 'document-expiration',
           'drug-alcohol', 'dataq-history', 'accident-summary', 'maintenance-costs'],
    index: true
  },
  reportName: {
    type: String,
    required: true
  },
  format: {
    type: String,
    required: true,
    enum: ['pdf', 'csv', 'xlsx']
  },
  // Store the exact filters used for this generation
  filters: {
    startDate: Date,
    endDate: Date,
    driverIds: [{ type: mongoose.Schema.Types.ObjectId }],
    vehicleIds: [{ type: mongoose.Schema.Types.ObjectId }],
    status: String,
    complianceStatus: String
  },
  // Selected fields from report builder (Phase 11)
  selectedFields: [String],
  // Template used (if any)
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReportTemplate'
  },
  templateName: String,
  // File storage
  filePath: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // bytes
    required: true
  },
  // Report metadata
  rowCount: Number, // How many records in the report
  // Timestamps for display
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Expiration tracking
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// TTL index: automatically delete documents after expiresAt
// Using expireAfterSeconds: 0 means MongoDB uses the expiresAt field value
reportHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for common queries
reportHistorySchema.index({ companyId: 1, generatedAt: -1 });
reportHistorySchema.index({ companyId: 1, reportType: 1, generatedAt: -1 });
reportHistorySchema.index({ generatedBy: 1, generatedAt: -1 });

// Virtual for human-readable report type
reportHistorySchema.virtual('reportDisplayName').get(function() {
  const names = {
    'dqf': 'Driver Qualification Files',
    'vehicle': 'Vehicle Maintenance',
    'violations': 'Violations Summary',
    'audit': 'Comprehensive Audit',
    'document-expiration': 'Document Expiration',
    'drug-alcohol': 'Drug & Alcohol Summary',
    'dataq-history': 'DataQ Challenge History',
    'accident-summary': 'Accident Summary',
    'maintenance-costs': 'Maintenance Costs'
  };
  return names[this.reportType] || this.reportType;
});

// Virtual for formatted file size
reportHistorySchema.virtual('fileSizeFormatted').get(function() {
  if (!this.fileSize) return '-';
  const kb = this.fileSize / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
});

// Virtual for days until expiration
reportHistorySchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diffMs = this.expiresAt - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included
reportHistorySchema.set('toJSON', { virtuals: true });
reportHistorySchema.set('toObject', { virtuals: true });

// Pre-save: set expiresAt if not set (90 days from generation)
reportHistorySchema.pre('save', function(next) {
  if (!this.expiresAt) {
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    this.expiresAt = new Date(Date.now() + ninetyDays);
  }
  next();
});

// Static: Get retention period in days
reportHistorySchema.statics.RETENTION_DAYS = 90;

// Static: Calculate expiration date
reportHistorySchema.statics.calculateExpiresAt = function() {
  const ninetyDays = this.RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ninetyDays);
};

module.exports = mongoose.model('ReportHistory', reportHistorySchema);
```

### Pattern 2: Report History Service (File Management)
**What:** Service handling file storage, cleanup, and history tracking
**When to use:** Report generation integration, orphan file cleanup
**Example:**
```javascript
// backend/services/reportHistoryService.js
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const ReportHistory = require('../models/ReportHistory');

const REPORTS_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'reports');

const reportHistoryService = {
  /**
   * Ensure company reports directory exists
   */
  async ensureDir(companyId) {
    const dir = path.join(REPORTS_UPLOAD_DIR, companyId.toString());
    await fs.mkdir(dir, { recursive: true });
    return dir;
  },

  /**
   * Generate unique filename for report
   */
  generateFileName(reportType, format) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${reportType}-${timestamp}-${uuidv4().slice(0, 8)}.${format}`;
  },

  /**
   * Save report file and create history record
   * @param {Buffer} fileBuffer - Report file content
   * @param {Object} options - Report metadata
   * @returns {Promise<ReportHistory>}
   */
  async saveReport(fileBuffer, options) {
    const {
      companyId,
      userId,
      userEmail,
      reportType,
      reportName,
      format,
      filters,
      selectedFields,
      templateId,
      templateName,
      rowCount
    } = options;

    // Ensure directory exists
    const dir = await this.ensureDir(companyId);

    // Generate unique filename
    const fileName = this.generateFileName(reportType, format);
    const filePath = path.join(dir, fileName);

    // Write file to disk
    await fs.writeFile(filePath, fileBuffer);

    // Get file size
    const stats = await fs.stat(filePath);

    // Create history record
    const history = await ReportHistory.create({
      companyId,
      generatedBy: userId,
      generatedByEmail: userEmail,
      reportType,
      reportName,
      format,
      filters,
      selectedFields,
      templateId,
      templateName,
      filePath,
      fileName,
      fileSize: stats.size,
      rowCount,
      expiresAt: ReportHistory.calculateExpiresAt()
    });

    return history;
  },

  /**
   * Delete file and history record
   */
  async deleteReport(historyId, companyId) {
    const history = await ReportHistory.findOne({
      _id: historyId,
      companyId
    });

    if (!history) {
      throw new Error('Report history not found');
    }

    // Delete file from disk
    try {
      await fs.unlink(history.filePath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('[ReportHistory] File deletion failed:', err.message);
      }
    }

    // Delete record (TTL would handle this, but allow manual deletion)
    await ReportHistory.deleteOne({ _id: historyId });
  },

  /**
   * Clean up orphan files (files without DB records)
   * Called by cron as backup to TTL
   */
  async cleanupOrphanFiles() {
    const companies = await fs.readdir(REPORTS_UPLOAD_DIR).catch(() => []);

    for (const companyDir of companies) {
      const companyPath = path.join(REPORTS_UPLOAD_DIR, companyDir);
      const files = await fs.readdir(companyPath).catch(() => []);

      for (const file of files) {
        const filePath = path.join(companyPath, file);

        // Check if record exists
        const exists = await ReportHistory.exists({ filePath });
        if (!exists) {
          console.log(`[ReportHistory] Cleaning orphan file: ${filePath}`);
          await fs.unlink(filePath).catch(() => {});
        }
      }
    }
  },

  /**
   * Clean up expired files (backup to TTL for files)
   * TTL handles DB records, this handles files
   */
  async cleanupExpiredFiles() {
    const expired = await ReportHistory.find({
      expiresAt: { $lte: new Date() }
    }).select('filePath');

    for (const record of expired) {
      try {
        await fs.unlink(record.filePath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('[ReportHistory] Expired file cleanup failed:', err.message);
        }
      }
    }
    // TTL will delete the records
  }
};

module.exports = reportHistoryService;
```

### Pattern 3: Integrate History Tracking into Report Generation
**What:** Modify existing report endpoints to save generated files and create history records
**When to use:** All report export endpoints (CSV, Excel, PDF)
**Example:**
```javascript
// In routes/reports.js - modify export logic

// Helper to capture stream output to buffer
const streamToBuffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};

// Modified DQF export endpoint (pattern for all reports)
router.get('/dqf', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { format = 'json', fields } = req.query;
  const companyId = req.companyFilter.companyId;

  // ... existing query and data preparation ...

  // For exports, save to history
  if (['csv', 'xlsx'].includes(format)) {
    // Generate file to buffer first
    let fileBuffer;
    let fileName;

    if (format === 'csv') {
      const { PassThrough } = require('stream');
      const passThrough = new PassThrough();

      // Write BOM
      passThrough.write('\ufeff');

      const csvStream = formatCSV({ headers: true });
      csvStream.pipe(passThrough);

      for (const row of rows) {
        csvStream.write(row);
      }
      csvStream.end();

      fileBuffer = await streamToBuffer(passThrough);
      fileName = exportService.generateFilename('dqf-report', 'csv');
    } else {
      // Excel - use WorkbookWriter to buffer
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Driver Qualification Files');
      worksheet.columns = columns;
      // ... add rows ...
      fileBuffer = await workbook.xlsx.writeBuffer();
      fileName = exportService.generateFilename('dqf-report', 'xlsx');
    }

    // Save to history
    const history = await reportHistoryService.saveReport(fileBuffer, {
      companyId,
      userId: req.user._id,
      userEmail: req.user.email,
      reportType: 'dqf',
      reportName: 'Driver Qualification Files',
      format,
      filters: {
        startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        driverIds: driverIds ? driverIds.split(',') : [],
        complianceStatus: req.query.complianceStatus
      },
      selectedFields: selectedFields,
      rowCount: rows.length
    });

    // Stream file to response
    res.setHeader('Content-Type', format === 'csv'
      ? 'text/csv; charset=utf-8'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('X-Report-History-Id', history._id.toString());
    res.send(fileBuffer);
    return;
  }

  // JSON response (no history tracking)
  return res.json({ success: true, report: { ... }, data: rows });
}));
```

### Pattern 4: Report History List Endpoint
**What:** API endpoint to list historical reports for a company
**When to use:** Report history page
**Example:**
```javascript
// backend/routes/reportHistory.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ReportHistory = require('../models/ReportHistory');
const { protect, restrictToCompany, checkPermission } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

router.use(protect);
router.use(restrictToCompany);

// @route   GET /api/report-history
// @desc    List report generation history for company
// @access  Private
router.get('/', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { reportType, page = 1, limit = 20 } = req.query;
  const companyId = req.companyFilter.companyId;

  const query = { companyId };
  if (reportType) {
    query.reportType = reportType;
  }

  const [history, total] = await Promise.all([
    ReportHistory.find(query)
      .populate('generatedBy', 'firstName lastName')
      .sort('-generatedAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    ReportHistory.countDocuments(query)
  ]);

  res.json({
    success: true,
    history,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// @route   GET /api/report-history/:id/download
// @desc    Download a previously generated report
// @access  Private
router.get('/:id/download', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;

  const history = await ReportHistory.findOne({
    _id: req.params.id,
    companyId
  });

  if (!history) {
    throw new AppError('Report not found', 404);
  }

  // Check if expired (in case TTL hasn't run yet)
  if (history.expiresAt < new Date()) {
    throw new AppError('Report has expired and is no longer available', 410);
  }

  // Verify file exists
  const absolutePath = path.resolve(history.filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new AppError('Report file not found on server', 404);
  }

  // Set response headers
  const mimeTypes = {
    'pdf': 'application/pdf',
    'csv': 'text/csv; charset=utf-8',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  res.setHeader('Content-Type', mimeTypes[history.format] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${history.fileName}"`);
  res.setHeader('Content-Length', history.fileSize);

  // Stream file
  const fileStream = fs.createReadStream(absolutePath);
  fileStream.pipe(res);
}));

// @route   GET /api/report-history/:id
// @desc    Get single history record with details
// @access  Private
router.get('/:id', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const companyId = req.companyFilter.companyId;

  const history = await ReportHistory.findOne({
    _id: req.params.id,
    companyId
  })
    .populate('generatedBy', 'firstName lastName email')
    .populate('templateId', 'name');

  if (!history) {
    throw new AppError('Report history not found', 404);
  }

  res.json({
    success: true,
    history
  });
}));

module.exports = router;
```

### Pattern 5: Frontend Report History Component
**What:** React component displaying historical reports with download buttons
**When to use:** Report history page
**Example:**
```jsx
// frontend/src/components/reports/ReportHistoryList.jsx
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FiDownload, FiFile, FiClock, FiFilter } from 'react-icons/fi';
import { reportHistoryAPI } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';
import Pagination from '../Pagination';

const REPORT_TYPE_LABELS = {
  'dqf': 'Driver Qualification',
  'vehicle': 'Vehicle Maintenance',
  'violations': 'Violations',
  'audit': 'Audit',
  'document-expiration': 'Document Expiration',
  'drug-alcohol': 'Drug & Alcohol',
  'dataq-history': 'DataQ History',
  'accident-summary': 'Accident Summary',
  'maintenance-costs': 'Maintenance Costs'
};

const FORMAT_ICONS = {
  'pdf': 'PDF',
  'csv': 'CSV',
  'xlsx': 'Excel'
};

const ReportHistoryList = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [filter, setFilter] = useState({ reportType: '' });
  const [downloading, setDownloading] = useState(null);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter.reportType) params.reportType = filter.reportType;

      const response = await reportHistoryAPI.getAll(params);
      setHistory(response.data.history);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to load report history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filter.reportType]);

  const handleDownload = async (record) => {
    setDownloading(record._id);
    try {
      const response = await reportHistoryAPI.download(record._id);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', record.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err.response?.status === 410) {
        alert('This report has expired and is no longer available.');
      } else {
        alert('Failed to download report.');
      }
    } finally {
      setDownloading(null);
    }
  };

  const formatFilters = (filters) => {
    if (!filters) return '-';
    const parts = [];
    if (filters.startDate) parts.push(`From: ${format(new Date(filters.startDate), 'MM/dd/yyyy')}`);
    if (filters.endDate) parts.push(`To: ${format(new Date(filters.endDate), 'MM/dd/yyyy')}`);
    if (filters.driverIds?.length) parts.push(`${filters.driverIds.length} drivers`);
    if (filters.vehicleIds?.length) parts.push(`${filters.vehicleIds.length} vehicles`);
    if (filters.status) parts.push(`Status: ${filters.status}`);
    return parts.length > 0 ? parts.join(', ') : 'All records';
  };

  if (loading && history.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <FiFilter className="text-zinc-400" />
        <select
          value={filter.reportType}
          onChange={(e) => setFilter({ reportType: e.target.value })}
          className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
        >
          <option value="">All Report Types</option>
          {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-300">Report</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-300">Format</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-300">Generated</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-300">By</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-300">Filters Used</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-300">Expires</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-zinc-600 dark:text-zinc-300">Download</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record._id} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FiFile className="text-zinc-400" />
                    <div>
                      <div className="font-medium text-zinc-800 dark:text-zinc-100">
                        {REPORT_TYPE_LABELS[record.reportType] || record.reportType}
                      </div>
                      {record.rowCount && (
                        <div className="text-xs text-zinc-500">{record.rowCount} records</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {FORMAT_ICONS[record.format] || record.format.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {format(new Date(record.generatedAt), 'MMM d, yyyy h:mm a')}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {record.generatedBy?.firstName} {record.generatedBy?.lastName}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-500 max-w-xs truncate">
                  {formatFilters(record.filters)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm">
                    <FiClock className="text-zinc-400" />
                    <span className={record.daysUntilExpiry <= 7 ? 'text-amber-600' : 'text-zinc-500'}>
                      {record.daysUntilExpiry} days
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleDownload(record)}
                    disabled={downloading === record._id}
                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Download report"
                  >
                    {downloading === record._id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <FiDownload className="w-5 h-5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  No report history found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={(page) => fetchHistory(page)}
        />
      )}
    </div>
  );
};

export default ReportHistoryList;
```

### Anti-Patterns to Avoid
- **Regenerating reports on demand:** Cannot reproduce historical data state; would show current data instead
- **Storing file content in MongoDB:** Large binaries in DB are inefficient; use disk with path reference
- **Manual TTL management:** MongoDB TTL indexes handle expiration atomically; avoid cron-based deletion of records
- **Forgetting file cleanup:** TTL deletes DB records but not files; need complementary file cleanup
- **Storing files without company isolation:** Always use `uploads/reports/{companyId}/` for tenant separation

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Document expiration | Manual cron deletion | MongoDB TTL index | Atomic, handles edge cases, no additional code |
| Unique file naming | Custom timestamp logic | uuid + timestamp | Already used in upload middleware, collision-free |
| File download auth | Custom token system | Existing auth middleware pattern | Follow `/api/documents/:id/download` pattern |
| File cleanup | Complex cron job | TTL + simple orphan cleanup | TTL handles 99% of cases; orphan cleanup is backup |
| Filter serialization | Custom JSON encoding | Mongoose Mixed type | Already handles object storage |

**Key insight:** The AuditLog model already demonstrates TTL-based retention (2 years), and the Document model shows authenticated file downloads. ReportHistory combines these proven patterns.

## Common Pitfalls

### Pitfall 1: TTL Deletes Records But Files Remain
**What goes wrong:** MongoDB TTL removes documents, but files on disk remain as orphans
**Why it happens:** TTL only affects MongoDB documents, not external storage
**How to avoid:** Run periodic orphan file cleanup (cron) as backup; consider pre-deletion hook if mongoose supports
**Warning signs:** `uploads/reports` directory grows unbounded over time

### Pitfall 2: File Not Found After TTL Deletion
**What goes wrong:** User tries to download, DB record exists (TTL hasn't run), but file was manually deleted
**Why it happens:** TTL runs every 60 seconds; race conditions with manual cleanup
**How to avoid:** Always check file existence before streaming; return 404 gracefully
**Warning signs:** Intermittent 500 errors on download endpoints

### Pitfall 3: Large Files Exceed Memory During Buffer Creation
**What goes wrong:** Generating large Excel files to buffer causes memory pressure
**Why it happens:** Buffering entire file before writing to disk
**How to avoid:** Stream directly to disk file, then save path; use temp file for streaming
**Warning signs:** Process memory spikes, OOM crashes on large reports

### Pitfall 4: Expired Report Returns 404 Instead of 410
**What goes wrong:** User gets confusing "not found" instead of "expired" message
**Why it happens:** Not checking expiresAt before checking file existence
**How to avoid:** Check expiration first; return 410 (Gone) with clear message
**Warning signs:** User confusion about missing reports they know they generated

### Pitfall 5: Missing Company Isolation in File Path
**What goes wrong:** Reports from different companies stored in same directory
**Why it happens:** Forgetting to include companyId in file path
**How to avoid:** Always use `uploads/reports/{companyId}/` structure
**Warning signs:** Security audit findings; potential data leakage

### Pitfall 6: Filter Parameters Not Serializable
**What goes wrong:** ObjectIds in filters don't display correctly in UI
**Why it happens:** Storing raw ObjectId arrays without resolution
**How to avoid:** Optionally store denormalized data (driver names) for display; or resolve on fetch
**Warning signs:** Filter display shows "[object Object]" or raw IDs

## Code Examples

Verified patterns from the existing codebase:

### Existing TTL Pattern (AuditLog)
```javascript
// From backend/models/AuditLog.js - TTL pattern
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 730 * 24 * 60 * 60 }); // 2 years

// For 90 days:
// 90 * 24 * 60 * 60 = 7,776,000 seconds
```

### Existing Authenticated Download Pattern (Document)
```javascript
// From backend/routes/documents.js
router.get('/:id/download', checkPermission('documents', 'view'), asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    ...req.companyFilter,
    isDeleted: false
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  const absolutePath = path.resolve(document.filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new AppError('File not found on server', 404);
  }

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const fileStream = fs.createReadStream(absolutePath);
  fileStream.pipe(res);
}));
```

### Existing File Storage Pattern (Upload Middleware)
```javascript
// From backend/middleware/upload.js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'documents';
    // ... category-based folder selection ...
    const uploadPath = path.join(process.cwd(), 'uploads', folder);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});
```

### Existing API Service Pattern
```javascript
// From frontend/src/utils/api.js - pattern for new API
export const reportHistoryAPI = {
  getAll: (params) => api.get('/report-history', { params }),
  getById: (id) => api.get(`/report-history/${id}`),
  download: (id) => api.get(`/report-history/${id}/download`, {
    responseType: 'blob',
    timeout: 300000
  })
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Regenerate on demand | Store generated files | Data integrity requirement | Historical accuracy preserved |
| Manual expiration cron | MongoDB TTL index | MongoDB 2.2+ | Automatic, atomic cleanup |
| Store files in DB | Disk storage with DB reference | Performance best practice | Better scalability, faster downloads |
| Fixed retention | Configurable TTL per document | expireAfterSeconds: 0 pattern | Flexible retention policies |

**Current best practices (2026):**
- Use MongoDB TTL indexes with `expireAfterSeconds: 0` and explicit `expiresAt` field for per-document retention
- Store files on disk with company-isolated directories
- Implement orphan file cleanup as backup to TTL
- Return HTTP 410 (Gone) for expired resources
- Store filter metadata denormalized for display without joins

## Open Questions

Things that couldn't be fully resolved:

1. **PDF generation integration**
   - What we know: CSV and Excel can be buffered easily; PDF uses streaming
   - What's unclear: How to capture PDF stream to buffer for history storage
   - Recommendation: For Phase 12, focus on CSV/Excel history. PDF history is optional enhancement. If needed, modify pdfGenerator to support buffer output mode.

2. **Storage space monitoring**
   - What we know: Files are stored on disk with 90-day retention
   - What's unclear: Should there be storage quotas per company?
   - Recommendation: For Phase 12, no quotas. Monitor disk usage; add quotas in future if needed.

3. **Scheduled report integration**
   - What we know: Scheduled reports run via cron and email results
   - What's unclear: Should scheduled report runs also create history records?
   - Recommendation: Yes, integrate scheduled reports with history tracking for consistency. The same history record pattern applies.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `backend/models/AuditLog.js` - TTL index pattern (2-year retention)
- Existing codebase: `backend/models/Document.js` - File path storage pattern
- Existing codebase: `backend/routes/documents.js` - Authenticated download endpoint
- Existing codebase: `backend/middleware/upload.js` - File storage with UUID naming
- [MongoDB TTL Indexes Documentation](https://www.mongodb.com/docs/manual/core/index-ttl/) - Official TTL index reference
- [MongoDB Expire Data Tutorial](https://www.mongodb.com/docs/manual/tutorial/expire-data/) - expireAfterSeconds: 0 pattern

### Secondary (MEDIUM confidence)
- [OneUpTime MongoDB TTL Index Strategies 2026](https://oneuptime.com/blog/post/2026-01-30-mongodb-ttl-index/view) - Best practices for TTL indexes
- [Mydbops MongoDB TTL Guide](https://www.mydbops.com/blog/mongodb-ttl-indexes) - Background thread behavior, 60-second interval

### Tertiary (LOW confidence)
- Web search results on report generation history patterns
- General audit trail pattern discussions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using only existing libraries and proven patterns from codebase
- Architecture: HIGH - Direct extension of AuditLog and Document patterns
- File management: HIGH - Follows established upload middleware patterns
- TTL implementation: HIGH - MongoDB official documentation confirms approach
- Pitfalls: MEDIUM - Based on general file/TTL experience, may surface edge cases

**Research date:** 2026-02-04
**Valid until:** 2026-05-04 (patterns are stable; MongoDB TTL behavior is well-established)
