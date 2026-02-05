/**
 * Export Service - Utility for report file generation
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
  }
};

module.exports = exportService;
