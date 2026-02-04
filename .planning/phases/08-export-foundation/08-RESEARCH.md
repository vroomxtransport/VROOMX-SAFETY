# Phase 8: Export Foundation - Research

**Researched:** 2026-02-04
**Domain:** CSV/Excel file export with streaming for large datasets
**Confidence:** HIGH

## Summary

This phase adds CSV and Excel (.xlsx) export capabilities to the existing report endpoints. The current codebase already has four report types (DQF, Vehicle Maintenance, Violations, Audit) that return JSON or PDF - this phase adds CSV and Excel as additional format options.

The recommended approach uses **ExcelJS** for Excel generation with streaming support, and **@fast-csv/format** for CSV generation. Both libraries support streaming to Express responses, which is critical for handling large reports (50+ drivers, multi-year data) without memory issues. The existing report endpoints already have the data fetching logic - we're adding export transformers.

**Primary recommendation:** Use ExcelJS with streaming WorkbookWriter for Excel exports and @fast-csv/format for CSV exports. Both pipe directly to `res` without buffering entire files in memory. Add UTF-8 BOM to CSV files for proper Spanish character display in Excel.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| exceljs | ^4.4.0 | Excel (.xlsx) generation | Streaming support for large files, styling/formatting, widely used (3.5M weekly downloads) |
| @fast-csv/format | ^5.0.0 | CSV generation | Stream-first architecture, TypeScript, battle-tested at scale |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | (existing) | Date formatting in exports | Already in codebase - use for consistent date formatting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ExcelJS | SheetJS (xlsx) | SheetJS is faster for simple cases but ExcelJS has better streaming support and styling APIs |
| @fast-csv/format | csv-stringify | Both work; fast-csv has cleaner API and TypeScript support |
| @fast-csv/format | Papa Parse | Papa Parse is browser-focused; fast-csv is more Node.js native |

**Installation:**
```bash
cd backend && npm install exceljs @fast-csv/format
```

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── services/
│   └── exportService.js       # NEW: Export generation service
├── utils/
│   └── pdfGenerator.js        # EXISTING: PDF generation
├── routes/
│   └── reports.js             # MODIFY: Add CSV/Excel format handling
```

### Pattern 1: Export Service with Format Handlers
**What:** Centralized service with methods for each export format, keeping route handlers clean
**When to use:** Always - separation of concerns
**Example:**
```javascript
// backend/services/exportService.js
const ExcelJS = require('exceljs');
const { format } = require('@fast-csv/format');

const exportService = {
  /**
   * Stream CSV to response with UTF-8 BOM for Excel compatibility
   * @param {Response} res - Express response object
   * @param {Object} options - { filename, headers, rows }
   */
  async streamCSV(res, { filename, headers, rows }) {
    // Set headers for download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write UTF-8 BOM for Excel compatibility with Spanish characters
    res.write('\ufeff');

    // Create CSV stream and pipe to response
    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    // Write header row
    csvStream.write(headers);

    // Stream rows one at a time
    for (const row of rows) {
      csvStream.write(row);
    }

    csvStream.end();
  },

  /**
   * Stream Excel to response using WorkbookWriter
   * @param {Response} res - Express response object
   * @param {Object} options - { filename, sheetName, columns, rows, headerStyle }
   */
  async streamExcel(res, { filename, sheetName, columns, rows, headerStyle }) {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
    const worksheet = workbook.addWorksheet(sheetName);

    // Set columns with widths
    worksheet.columns = columns;

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    headerRow.commit();

    // Stream data rows
    for (const row of rows) {
      worksheet.addRow(row).commit();
    }

    await worksheet.commit();
    await workbook.commit();
  }
};

module.exports = exportService;
```

### Pattern 2: Format Parameter Extension
**What:** Extend existing report endpoints to accept `format=csv` or `format=xlsx`
**When to use:** For all report endpoints
**Example:**
```javascript
// In routes/reports.js - extend existing endpoint
router.get('/dqf', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { driverId, format = 'json' } = req.query;

  // ... existing data fetching logic ...

  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    return exportService.streamCSV(res, {
      filename: `dqf-report-${timestamp}.csv`,
      headers: ['Driver Name', 'Employee ID', 'CDL Status', 'Medical Card', 'Overall Status'],
      rows: drivers.map(d => [
        `${d.firstName} ${d.lastName}`,
        d.employeeId || '',
        d.complianceStatus?.cdlStatus || '',
        d.complianceStatus?.medicalStatus || '',
        d.complianceStatus?.overall || ''
      ])
    });
  }

  if (format === 'xlsx') {
    return exportService.streamExcel(res, {
      filename: `dqf-report-${timestamp}.xlsx`,
      sheetName: 'Driver Qualification Files',
      columns: [
        { header: 'Driver Name', key: 'name', width: 25 },
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'CDL Status', key: 'cdlStatus', width: 15 },
        { header: 'Medical Card', key: 'medicalStatus', width: 15 },
        { header: 'Overall Status', key: 'overall', width: 15 }
      ],
      rows: drivers.map(d => ({
        name: `${d.firstName} ${d.lastName}`,
        employeeId: d.employeeId || '',
        cdlStatus: d.complianceStatus?.cdlStatus || '',
        medicalStatus: d.complianceStatus?.medicalStatus || '',
        overall: d.complianceStatus?.overall || ''
      }))
    });
  }

  // ... existing PDF and JSON handling ...
}));
```

### Pattern 3: MongoDB Cursor Streaming for Large Datasets
**What:** Use Mongoose cursor instead of `.find()` array for memory efficiency
**When to use:** When reports can have 50+ rows or multi-year data
**Example:**
```javascript
// For very large datasets, use cursor streaming
async streamLargeReport(res, query, transform) {
  const cursor = Model.find(query).cursor();

  for await (const doc of cursor) {
    // Transform and write one document at a time
    const row = transform(doc);
    csvStream.write(row);
  }
}
```

### Anti-Patterns to Avoid
- **Loading all data into array first:** Don't `await Model.find().toArray()` for large datasets - use cursors
- **Buffering entire file in memory:** Don't create workbook, write to buffer, then send - stream directly to response
- **Missing Content-Disposition:** Always set header for proper filename in download dialog
- **Forgetting UTF-8 BOM:** CSV without BOM will show garbled Spanish characters in Excel

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV escaping | Manual quote/comma handling | @fast-csv/format | Edge cases: quotes in values, newlines, Unicode |
| Excel cell formatting | Manual XML generation | ExcelJS | OOXML spec is complex; dates, numbers, styles |
| Column width calculation | Character counting | ExcelJS column.width | Font rendering varies; ExcelJS handles it |
| File streaming | Manual chunk management | ExcelJS WorkbookWriter | Backpressure handling, memory management |

**Key insight:** Excel's OOXML format is deceptively complex. A "simple" xlsx file is actually a ZIP containing multiple XML files with specific schemas. ExcelJS handles this complexity.

## Common Pitfalls

### Pitfall 1: CSV Opens with Garbled Characters in Excel
**What goes wrong:** Spanish names like "Jose Garcia" show as "JosÃ© GarcÃ­a"
**Why it happens:** Excel doesn't auto-detect UTF-8 encoding for CSV files
**How to avoid:** Always prepend UTF-8 BOM (`\ufeff` or bytes `EF BB BF`) to CSV output
**Warning signs:** Users report "weird characters" in downloaded CSV files

### Pitfall 2: Memory Exhaustion on Large Reports
**What goes wrong:** Server crashes or times out generating report with 1000+ rows
**Why it happens:** Loading entire dataset into memory, then converting to file format
**How to avoid:**
1. Use streaming workbook writer (ExcelJS) not regular Workbook
2. Use Mongoose cursor instead of `.find()` returning array
3. Call `.commit()` on rows immediately after adding them
**Warning signs:** Reports work for small companies, fail for large fleets

### Pitfall 3: Download Starts But File is Empty or Corrupt
**What goes wrong:** User downloads file, but Excel says "file is corrupt"
**Why it happens:** Not awaiting `workbook.commit()` before response ends
**How to avoid:** Always `await workbook.commit()` - this flushes all data
**Warning signs:** Works locally but fails in production (timing differences)

### Pitfall 4: Response Already Sent Error
**What goes wrong:** "Cannot set headers after they are sent" error
**Why it happens:** Error occurs mid-stream after headers already sent
**How to avoid:** Wrap entire export in try/catch, handle errors before streaming starts
**Warning signs:** Intermittent errors that are hard to reproduce

### Pitfall 5: Dates Display as Numbers in Excel
**What goes wrong:** Date column shows "45234" instead of "2023-11-15"
**Why it happens:** Excel stores dates as serial numbers; format not applied
**How to avoid:** Use ExcelJS cell format: `cell.numFmt = 'yyyy-mm-dd'`
**Warning signs:** Dates look correct in JSON but wrong in Excel

## Code Examples

Verified patterns for this codebase:

### Complete Export Service
```javascript
// backend/services/exportService.js
const ExcelJS = require('exceljs');
const { format: formatCSV } = require('@fast-csv/format');
const { format: formatDate } = require('date-fns');

const exportService = {
  /**
   * Generate filename with report type and timestamp
   */
  generateFilename(reportType, extension) {
    const timestamp = formatDate(new Date(), 'yyyy-MM-dd-HHmm');
    return `${reportType}-${timestamp}.${extension}`;
  },

  /**
   * Stream CSV to Express response
   * Handles UTF-8 BOM for Excel compatibility with Spanish characters
   */
  async streamCSV(res, { reportType, headers, rows }) {
    const filename = this.generateFilename(reportType, 'csv');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // UTF-8 BOM for Excel to recognize encoding (critical for Spanish names)
    res.write('\ufeff');

    const csvStream = formatCSV({ headers: true });
    csvStream.pipe(res);

    // Write header row as object keys
    // fast-csv handles this automatically when headers: true

    // Stream data rows
    for (const row of rows) {
      csvStream.write(row);
    }

    csvStream.end();
  },

  /**
   * Stream Excel to Express response using WorkbookWriter
   * Memory efficient for large datasets
   */
  async streamExcel(res, { reportType, sheetName, columns, rows, company }) {
    const filename = this.generateFilename(reportType, 'xlsx');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Use streaming WorkbookWriter for memory efficiency
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
    const worksheet = workbook.addWorksheet(sheetName);

    // Set column definitions with headers and widths
    worksheet.columns = columns;

    // Style the header row (row 1)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF333333' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E8E8' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.commit();

    // Stream data rows - commit each row immediately to free memory
    for (const rowData of rows) {
      const row = worksheet.addRow(rowData);
      row.commit();
    }

    // Commit worksheet and workbook to flush to response
    await worksheet.commit();
    await workbook.commit();
  },

  /**
   * Calculate appropriate column widths based on content
   * Returns columns with width property set
   */
  calculateColumnWidths(columns, rows, minWidth = 12, maxWidth = 50) {
    return columns.map((col, idx) => {
      const headerLen = col.header.length;
      const maxContentLen = rows.reduce((max, row) => {
        const value = Array.isArray(row) ? row[idx] : row[col.key];
        const len = value ? String(value).length : 0;
        return Math.max(max, len);
      }, 0);

      const width = Math.min(maxWidth, Math.max(minWidth, headerLen, maxContentLen + 2));
      return { ...col, width };
    });
  }
};

module.exports = exportService;
```

### Frontend API Update
```javascript
// frontend/src/utils/api.js - extend reportsAPI
export const reportsAPI = {
  getDqfReport: (params) => api.get('/reports/dqf', {
    params,
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json'
  }),
  // ... same pattern for other reports
};
```

### Frontend Download Handler
```javascript
// frontend/src/pages/Reports.jsx - extend handleGenerateReport
const handleGenerateReport = async (reportId, format = 'pdf') => {
  // ... existing code ...

  if (['pdf', 'csv', 'xlsx'].includes(format)) {
    const extension = format === 'xlsx' ? 'xlsx' : format;
    const mimeTypes = {
      pdf: 'application/pdf',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    downloadBlob(response.data, `${report.id}-report-${Date.now()}.${extension}`);
    toast.success('Report downloaded successfully');
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Buffer entire file in memory | Stream directly to response | ExcelJS 4.0 (2020) | Handles files with millions of rows |
| CSV with no BOM | CSV with UTF-8 BOM | Industry standard | International character support |
| `workbook.xlsx.write()` | `stream.xlsx.WorkbookWriter` | ExcelJS 3.0 | Memory efficient for large files |

**Deprecated/outdated:**
- `exceljs` versions < 4.0: Use 4.4+ for latest streaming improvements
- Manual CSV string building: Use dedicated CSV libraries for proper escaping

## Open Questions

Things that couldn't be fully resolved:

1. **Exact timeout threshold for large reports**
   - What we know: Default Express timeout is 2 minutes, default Axios timeout is 15 seconds
   - What's unclear: Exact time needed for 1000+ row Excel generation
   - Recommendation: Set request timeout to 5 minutes for export endpoints; monitor in production

2. **Excel file size limits**
   - What we know: Excel supports 1M+ rows, but browser download may have practical limits
   - What's unclear: At what point should we warn users or paginate?
   - Recommendation: Start without limits; add warning if files exceed 10MB

## Sources

### Primary (HIGH confidence)
- [ExcelJS GitHub](https://github.com/exceljs/exceljs) - Streaming API, styling, column widths
- [fast-csv GitHub](https://github.com/C2FO/fast-csv) - Streaming CSV formatting
- [Mongoose QueryCursor Docs](https://mongoosejs.com/docs/api/querycursor.html) - Cursor streaming API

### Secondary (MEDIUM confidence)
- [ExcelJS Streaming to Express](https://codepunk.io/streaming-excel-to-the-browser-in-node-js-and-javascript/) - Response streaming pattern
- [CSV UTF-8 BOM for Excel](https://blog.theodo.com/2017/04/csv-excel-escape-from-the-encoding-hell-in-nodejs/) - BOM requirement explained
- [Auto Column Width with ExcelJS](https://atlassc.net/2022/11/14/auto-column-width-with-exceljs) - Width calculation pattern
- [MongoDB Streams for Export](https://medium.com/nerd-for-tech/transform-export-bulk-database-response-without-memory-overflow-using-mongodb-node-js-streams-bcbb3415dd9c) - Cursor streaming pattern

### Tertiary (LOW confidence)
- npm-compare.com library comparisons - Popularity metrics

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - ExcelJS and fast-csv are well-documented, widely used
- Architecture: HIGH - Patterns verified against official documentation
- Pitfalls: HIGH - Common issues documented in GitHub issues and community posts

**Research date:** 2026-02-04
**Valid until:** 2026-05-04 (libraries are stable, patterns unlikely to change)
