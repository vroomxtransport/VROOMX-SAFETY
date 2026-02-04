const { format: formatCSV } = require('@fast-csv/format');
const ExcelJS = require('exceljs');

/**
 * Export Service - Streaming CSV and Excel generation for reports
 *
 * Uses streaming architecture for memory efficiency on large datasets:
 * - CSV: @fast-csv/format streams rows directly to response
 * - Excel: ExcelJS WorkbookWriter commits rows immediately without holding in memory
 */

const exportService = {
  /**
   * Generate descriptive filename with timestamp
   * Format: {reportType}-{yyyy-MM-dd-HHmm}.{extension}
   *
   * @param {string} reportType - Type of report (e.g., 'dqf-report', 'violations-report')
   * @param {string} extension - File extension ('csv' or 'xlsx')
   * @returns {string} Formatted filename
   */
  generateFilename(reportType, extension) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${reportType}-${year}-${month}-${day}-${hours}${minutes}.${extension}`;
  },

  /**
   * Stream CSV to Express response
   * Writes UTF-8 BOM before piping for Spanish character support in Excel
   *
   * @param {Response} res - Express response object
   * @param {Object} options - Export options
   * @param {string} options.reportType - Type of report for filename
   * @param {Object} options.headers - Column headers (keys should match row data keys)
   * @param {Array<Object>} options.rows - Array of row objects
   */
  streamCSV(res, { reportType, headers, rows }) {
    const filename = this.generateFilename(reportType, 'csv');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write UTF-8 BOM BEFORE piping CSV stream (CRITICAL for Spanish characters in Excel)
    res.write('\ufeff');

    const csvStream = formatCSV({ headers: true });
    csvStream.pipe(res);

    // Write each row
    for (const row of rows) {
      csvStream.write(row);
    }

    csvStream.end();
  },

  /**
   * Stream Excel to Express response
   * Uses WorkbookWriter for memory efficiency - commits rows immediately
   *
   * @param {Response} res - Express response object
   * @param {Object} options - Export options
   * @param {string} options.reportType - Type of report for filename
   * @param {string} options.sheetName - Name of the worksheet
   * @param {Array<Object>} options.columns - Column definitions [{header, key, width}]
   * @param {Array<Object>} options.rows - Array of row objects
   */
  async streamExcel(res, { reportType, sheetName, columns, rows }) {
    const filename = this.generateFilename(reportType, 'xlsx');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Use WorkbookWriter for streaming (NOT regular Workbook - critical for memory)
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true
    });

    const worksheet = workbook.addWorksheet(sheetName);

    // Set column definitions
    worksheet.columns = columns;

    // Style header row: bold font, light gray fill, center alignment
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E8E8' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.commit(); // Commit header immediately for memory efficiency

    // Write each row and commit immediately (memory efficiency)
    for (const rowData of rows) {
      const row = worksheet.addRow(rowData);
      row.commit();
    }

    // CRITICAL: Must await both commits
    await worksheet.commit();
    await workbook.commit();
  }
};

module.exports = exportService;
