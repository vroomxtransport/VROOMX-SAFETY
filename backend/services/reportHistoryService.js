const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ReportHistory = require('../models/ReportHistory');

const REPORTS_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'reports');

/**
 * Ensure the reports directory exists for a company
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Directory path
 */
const ensureDir = async (companyId) => {
  const dir = path.join(REPORTS_UPLOAD_DIR, companyId.toString());
  try {
    await fs.mkdir(dir, { recursive: true });
    console.log(`[ReportHistory] Ensured directory: ${dir}`);
    return dir;
  } catch (error) {
    console.error(`[ReportHistory] Error creating directory: ${error.message}`);
    throw error;
  }
};

/**
 * Generate a unique filename for a report
 * @param {string} reportType - Type of report
 * @param {string} format - File format (csv, xlsx)
 * @returns {string} Unique filename
 */
const generateFileName = (reportType, format) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const uniqueId = uuidv4().split('-')[0];
  return `${reportType}-${timestamp}-${uniqueId}.${format}`;
};

/**
 * Save a generated report file and create history record
 * @param {Buffer} fileBuffer - Report file content
 * @param {Object} options - Report metadata
 * @returns {Promise<Object>} Created history record
 */
const saveReport = async (fileBuffer, options) => {
  const {
    companyId,
    userId,
    userEmail,
    reportType,
    reportName,
    format,
    filters = {},
    selectedFields = [],
    templateId = null,
    templateName = null,
    rowCount = null
  } = options;

  // Ensure directory exists
  const dir = await ensureDir(companyId);

  // Generate unique filename
  const fileName = generateFileName(reportType, format);
  const filePath = path.join(dir, fileName);

  // Write file to disk
  await fs.writeFile(filePath, fileBuffer);
  console.log(`[ReportHistory] Saved report file: ${filePath}`);

  // Get file stats
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

  console.log(`[ReportHistory] Created history record: ${history._id}`);
  return history;
};

/**
 * Delete a report file and its history record
 * @param {string} historyId - History record ID
 * @param {string} companyId - Company ID for verification
 * @returns {Promise<boolean>} True if deleted
 */
const deleteReport = async (historyId, companyId) => {
  const history = await ReportHistory.findOne({
    _id: historyId,
    companyId
  });

  if (!history) {
    console.log(`[ReportHistory] History record not found: ${historyId}`);
    return false;
  }

  // Delete file (ignore if already gone)
  try {
    await fs.unlink(history.filePath);
    console.log(`[ReportHistory] Deleted file: ${history.filePath}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`[ReportHistory] Error deleting file: ${error.message}`);
    }
  }

  // Delete record
  await ReportHistory.deleteOne({ _id: historyId });
  console.log(`[ReportHistory] Deleted history record: ${historyId}`);

  return true;
};

/**
 * Clean up orphaned report files (files without matching DB records)
 * @returns {Promise<Object>} Cleanup results
 */
const cleanupOrphanFiles = async () => {
  const results = {
    scanned: 0,
    deleted: 0,
    errors: []
  };

  try {
    // Check if reports directory exists
    if (!fsSync.existsSync(REPORTS_UPLOAD_DIR)) {
      console.log('[ReportHistory] Reports directory does not exist, nothing to clean');
      return results;
    }

    // Get all company directories
    const companyDirs = await fs.readdir(REPORTS_UPLOAD_DIR);

    for (const companyDir of companyDirs) {
      const companyPath = path.join(REPORTS_UPLOAD_DIR, companyDir);
      const stat = await fs.stat(companyPath);

      if (!stat.isDirectory()) continue;

      // Get all files in company directory
      const files = await fs.readdir(companyPath);

      for (const file of files) {
        results.scanned++;
        const filePath = path.join(companyPath, file);

        // Check if file has matching DB record
        const exists = await ReportHistory.exists({ filePath });

        if (!exists) {
          try {
            await fs.unlink(filePath);
            results.deleted++;
            console.log(`[ReportHistory] Deleted orphan file: ${filePath}`);
          } catch (error) {
            results.errors.push({ file: filePath, error: error.message });
          }
        }
      }
    }

    console.log(`[ReportHistory] Cleanup complete: ${results.scanned} scanned, ${results.deleted} deleted`);
    return results;
  } catch (error) {
    console.error(`[ReportHistory] Cleanup error: ${error.message}`);
    results.errors.push({ error: error.message });
    return results;
  }
};

module.exports = {
  REPORTS_UPLOAD_DIR,
  ensureDir,
  generateFileName,
  saveReport,
  deleteReport,
  cleanupOrphanFiles
};
