# Technology Stack: Enhanced Reports Module

**Project:** VroomX Safety - Enhanced Reporting
**Researched:** 2026-02-04
**Mode:** Stack Additions for Existing Project

## Executive Summary

The existing stack already has solid foundations for enhanced reporting. The project uses **pdfkit** for basic PDF generation and **Puppeteer** (via pdfService.js) for HTML-to-PDF rendering with charts. The frontend has **Recharts** for visualization and **jsPDF** for client-side PDF needs.

**Key recommendation:** Leverage existing Puppeteer + HTML templates pattern for complex reports with charts. Add **ExcelJS** for Excel export. Avoid adding react-pdf-viewer - use simpler iframe/object preview approach. Keep report builder UI simple with checkboxes, not drag-drop.

## Current Stack (Already Installed - DO NOT ADD)

| Technology | Version | Current Use |
|------------|---------|-------------|
| pdfkit | ^0.17.2 | Basic PDF generation (tables, text) |
| puppeteer-core + @sparticuz/chromium | ^24.35.0 + ^143.0.4 | HTML-to-PDF for CSA reports with charts |
| jspdf + jspdf-autotable | ^2.5.1 + ^3.8.1 | Frontend PDF generation |
| Recharts | ^2.10.3 | Frontend charting |
| EJS | ^4.0.1 | HTML template rendering |

## Recommended Stack Additions

### Backend: Excel/CSV Export

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **exceljs** | ^4.4.0 | Excel (.xlsx) generation | Industry standard for Node.js Excel export. Supports streaming for large datasets, styling, formulas, multiple sheets. Already mature with TypeScript support. |
| **csv-stringify** | ^6.5.0 | CSV generation | Part of node-csv ecosystem. Stream-based, memory-efficient. Handles edge cases (quotes, commas) correctly. |

**Why ExcelJS over alternatives:**
- SheetJS/xlsx: Less intuitive streaming, requires more setup
- json2csv: Simpler but lacks Excel formatting options
- ExcelJS streaming (WorkbookWriter) handles 10,000+ row reports without memory issues

### Frontend: Report Preview

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **None required** | - | PDF preview in browser | Use native `<iframe>` or `<object>` with PDF blob URL. All modern browsers render PDFs natively. |

**Why NOT react-pdf or react-pdf-viewer:**
- react-pdf-viewer: Last updated 2023, compatibility concerns with React 18+
- react-pdf: Adds ~2MB bundle size, complex PDF.js worker setup
- Native iframe: Zero dependencies, works everywhere, simpler implementation

**Preview Implementation Pattern:**
```javascript
// Create blob URL from PDF buffer
const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
const pdfUrl = URL.createObjectURL(pdfBlob);
// Render in iframe
<iframe src={pdfUrl} width="100%" height="600px" />
```

### Backend: PDF Enhancement (Charts in PDFs)

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Keep existing pdfService.js pattern** | - | Charts in PDFs | Puppeteer + HTML templates already working for CSA reports. Extend this pattern. |
| **chart.js** (server-side via canvas) | ^4.4.0 | Static chart images | Only if Puppeteer proves too slow. chart.js + node-canvas can render charts to PNG for pdfkit embedding. |

**Why extend Puppeteer pattern:**
- Already implemented and working (see `pdfService.js`)
- HTML/CSS is easier to style than pdfkit imperative API
- Recharts components can be rendered server-side with jsdom if needed
- Existing EJS templates can be extended

**When to use pdfkit vs Puppeteer:**
| Use Case | Tool | Reason |
|----------|------|--------|
| Simple tables, text-heavy reports | pdfkit | Faster, lower memory |
| Charts, complex layouts, styling | Puppeteer + HTML | Easier to design, pixel-perfect |
| FMCSA compliance forms | Puppeteer + HTML | Precise formatting requirements |

### Report Builder UI Components

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **None required** | - | Field selection, filters | Use existing Tailwind + React patterns. Checkboxes and multi-selects are sufficient. |

**Why NOT drag-drop builders:**
- Joyfill SDK: Commercial, adds complexity
- react-beautiful-dnd: Overkill for field selection
- User research shows compliance users prefer checkboxes over drag-drop
- Simpler implementation, fewer bugs, better accessibility

**Recommended UI Pattern:**
```jsx
// Simple field selector
<div className="grid grid-cols-2 gap-2">
  {availableFields.map(field => (
    <label key={field.id} className="flex items-center gap-2">
      <input type="checkbox" checked={selectedFields.includes(field.id)} />
      {field.label}
    </label>
  ))}
</div>
```

### Report History/Template Storage

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **MongoDB (existing)** | ^8.0.3 | Report history, templates | Already have ScheduledReport model. Extend pattern. |
| **GridFS or S3** | - | PDF blob storage | For storing generated PDFs. GridFS for simplicity, S3 for scale. |

**New MongoDB Models Needed:**

```javascript
// GeneratedReport - stores report history
{
  companyId: ObjectId,
  reportType: String,
  reportName: String,
  generatedBy: ObjectId,
  generatedAt: Date,
  filters: Object,
  selectedFields: [String],
  format: 'pdf' | 'xlsx' | 'csv',
  fileSize: Number,
  filePath: String, // GridFS ID or S3 key
  metadata: Object, // recordCount, dateRange, etc.
  expiresAt: Date // TTL for auto-cleanup
}

// ReportTemplate - stores custom report configurations
{
  companyId: ObjectId,
  createdBy: ObjectId,
  name: String,
  reportType: String,
  selectedFields: [String],
  defaultFilters: Object,
  isShared: Boolean // available to whole company?
}
```

## What NOT to Add

| Technology | Reason to Avoid |
|------------|-----------------|
| **react-pdf** | Bundle bloat (~2MB), complex worker setup, native iframe works fine |
| **react-pdf-viewer** | Unmaintained since 2023, React 18 compatibility concerns |
| **pdfmake** | Would duplicate existing pdfkit/Puppeteer capabilities |
| **pdf-lib** | Overkill - we generate PDFs, not edit existing ones |
| **react-beautiful-dnd** | Drag-drop UI is overkill for field selection |
| **Joyfill SDK** | Commercial, heavy, unnecessary complexity |
| **SheetJS Pro** | Commercial. ExcelJS free version is sufficient |
| **ClickHouse/TimescaleDB** | OLAP overkill for compliance reports. MongoDB aggregation sufficient. |

## Installation Commands

### Backend
```bash
cd backend
npm install exceljs@^4.4.0 csv-stringify@^6.5.0
```

### Frontend
```bash
# No new packages needed for preview (use native iframe)
# Existing jspdf, jspdf-autotable, recharts are sufficient
```

## Integration Points

### 1. Excel Export Service Pattern
```javascript
// backend/services/excelExportService.js
const ExcelJS = require('exceljs');

const excelExportService = {
  async generateReport(data, columns, options = {}) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(options.sheetName || 'Report');

    // Define columns with headers and widths
    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 15
    }));

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE4E4E7' } // Zinc-200
    };

    // Add data rows
    data.forEach(row => worksheet.addRow(row));

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(64 + columns.length)}1`
    };

    return workbook.xlsx.writeBuffer();
  }
};
```

### 2. CSV Export Service Pattern
```javascript
// backend/services/csvExportService.js
const { stringify } = require('csv-stringify');
const { Readable } = require('stream');

const csvExportService = {
  async generateCSV(data, columns) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      const stringifier = stringify({
        header: true,
        columns: columns.map(c => ({ key: c.key, header: c.header }))
      });

      stringifier.on('data', chunk => chunks.push(chunk));
      stringifier.on('end', () => resolve(Buffer.concat(chunks)));
      stringifier.on('error', reject);

      data.forEach(row => stringifier.write(row));
      stringifier.end();
    });
  }
};
```

### 3. Report Preview Endpoint Pattern
```javascript
// Add to backend/routes/reports.js
router.get('/:type/preview', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { fields, ...filters } = req.query;

  // Generate PDF buffer (not stream)
  const pdfBuffer = await reportService.generatePreview(type, {
    companyId: req.companyFilter.companyId,
    fields: fields?.split(','),
    filters
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline'); // inline for preview, attachment for download
  res.send(pdfBuffer);
}));
```

### 4. Frontend Preview Component Pattern
```javascript
// frontend/src/components/ReportPreview.jsx
const ReportPreview = ({ reportType, filters, selectedFields }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getPreview(reportType, {
        ...filters,
        fields: selectedFields.join(',')
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [pdfUrl]);

  return (
    <div className="border rounded-lg overflow-hidden">
      {loading && <LoadingSpinner />}
      {pdfUrl && (
        <iframe
          src={pdfUrl}
          className="w-full h-[600px]"
          title="Report Preview"
        />
      )}
      {!pdfUrl && !loading && (
        <button onClick={generatePreview} className="btn btn-primary">
          Generate Preview
        </button>
      )}
    </div>
  );
};
```

## FMCSA Compliance Formatting

For FMCSA-compliant report formatting, extend the existing Puppeteer + HTML template pattern:

1. **Create compliance-specific templates** in `backend/templates/`:
   - `dqf-compliance.html` - 49 CFR 391 format
   - `vehicle-inspection.html` - 49 CFR 396 format
   - `audit-ready.html` - Full audit packet format

2. **Required formatting elements:**
   - Company letterhead with DOT number prominently displayed
   - Report generation timestamp
   - Page numbers ("Page X of Y")
   - Regulatory references in footer
   - Signature blocks where required

3. **Use existing `pdfService.generatePDF()` method:**
   ```javascript
   const html = await ejs.renderFile(templatePath, data);
   const pdfBuffer = await pdfService.generatePDF(html, {
     format: 'Letter',
     margin: { top: '0.75in', bottom: '0.75in', left: '0.5in', right: '0.5in' }
   });
   ```

## Performance Considerations

| Report Size | Approach | Expected Time |
|-------------|----------|---------------|
| < 100 rows | pdfkit direct | < 500ms |
| 100-1000 rows | Puppeteer + HTML | 1-3s |
| 1000-10000 rows | ExcelJS streaming | 2-5s |
| > 10000 rows | Background job + email delivery | Async |

**For large reports:**
1. Use existing `scheduledReportService.js` pattern
2. Generate in background, email when complete
3. Store in GridFS/S3 with TTL for download link

## Confidence Assessment

| Recommendation | Confidence | Rationale |
|----------------|------------|-----------|
| ExcelJS for Excel export | HIGH | Industry standard, verified v4.4.0 features |
| csv-stringify for CSV | HIGH | Part of mature node-csv ecosystem |
| Native iframe for preview | HIGH | Standard browser capability, zero dependencies |
| Extend Puppeteer pattern | HIGH | Already working in codebase |
| Skip react-pdf-viewer | HIGH | Unmaintained, bundle bloat, alternatives exist |
| Skip drag-drop UI | MEDIUM | Based on typical compliance user preferences |
| MongoDB for history | HIGH | Consistent with existing architecture |

## Sources

- [ExcelJS GitHub Releases](https://github.com/exceljs/exceljs/releases) - v4.4.0 features
- [ExcelJS 2026 Streaming Guide](https://copyprogramming.com/howto/stream-huge-excel-file-using-exceljs-in-node) - Best practices for large files
- [node-csv Documentation](https://csv.js.org/) - CSV streaming patterns
- [Top PDF Generation Libraries 2025](https://pdfbolt.com/blog/top-nodejs-pdf-generation-libraries) - pdfkit vs Puppeteer comparison
- [React PDF Viewer Comparison](https://npm-compare.com/@react-pdf-viewer/core,react-pdf) - Maintenance status concerns
- [MongoDB Pre-Aggregated Reports](https://mongodb-documentation.readthedocs.io/en/latest/use-cases/pre-aggregated-reports.html) - Report storage patterns
