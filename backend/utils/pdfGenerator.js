const PDFDocument = require('pdfkit');
const { format, isValid } = require('date-fns');

/**
 * PDF Generator utility for compliance reports
 */

// Brand colors
const COLORS = {
  primary: '#DC2626', // Red-600
  secondary: '#18181B', // Zinc-900
  text: '#3F3F46', // Zinc-700
  lightText: '#71717A', // Zinc-500
  border: '#E4E4E7', // Zinc-200
  background: '#FAFAFA' // Zinc-50
};

/**
 * Create a new PDF document with standard settings
 */
const createDocument = () => {
  return new PDFDocument({
    size: 'LETTER',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true
  });
};

/**
 * Add company header to PDF
 */
const addHeader = (doc, company, reportTitle) => {
  // Company name
  doc.fontSize(20)
     .fillColor(COLORS.primary)
     .text(company.name || 'Company Report', { align: 'left' });

  // DOT Number
  if (company.dotNumber) {
    doc.fontSize(10)
       .fillColor(COLORS.lightText)
       .text(`DOT# ${company.dotNumber}`, { align: 'left' });
  }

  doc.moveDown(0.5);

  // Report title
  doc.fontSize(16)
     .fillColor(COLORS.secondary)
     .text(reportTitle, { align: 'left' });

  // Generation date
  doc.fontSize(9)
     .fillColor(COLORS.lightText)
     .text(`Generated: ${format(new Date(), 'MM/dd/yyyy h:mm a')} UTC`, { align: 'left' });

  // Divider line
  doc.moveDown(0.5);
  doc.strokeColor(COLORS.border)
     .lineWidth(1)
     .moveTo(50, doc.y)
     .lineTo(doc.page.width - 50, doc.y)
     .stroke();

  doc.moveDown(1);
};

/**
 * Add a section title
 */
const addSectionTitle = (doc, title) => {
  doc.fontSize(14)
     .fillColor(COLORS.primary)
     .text(title, { underline: false });
  doc.moveDown(0.5);
};

/**
 * Add a simple table
 */
const addTable = (doc, headers, rows, columnWidths) => {
  const startX = 50;
  const startY = doc.y;
  const rowHeight = 20;
  const tableWidth = doc.page.width - 100;

  // Calculate column widths if not provided
  if (!columnWidths) {
    const colWidth = tableWidth / headers.length;
    columnWidths = headers.map(() => colWidth);
  }

  // Header row
  doc.fontSize(9)
     .fillColor(COLORS.secondary);

  let x = startX;
  headers.forEach((header, i) => {
    doc.text(header, x, startY, { width: columnWidths[i], align: 'left' });
    x += columnWidths[i];
  });

  // Header underline
  doc.strokeColor(COLORS.border)
     .lineWidth(0.5)
     .moveTo(startX, startY + rowHeight - 5)
     .lineTo(startX + tableWidth, startY + rowHeight - 5)
     .stroke();

  // Data rows
  let y = startY + rowHeight;
  doc.fontSize(9)
     .fillColor(COLORS.text);

  rows.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;
    }

    x = startX;
    row.forEach((cell, i) => {
      const cellText = cell !== null && cell !== undefined ? String(cell) : '-';
      doc.text(cellText, x, y, { width: columnWidths[i], align: 'left' });
      x += columnWidths[i];
    });
    y += rowHeight;
  });

  doc.y = y + 10;
};

/**
 * Add key-value pairs
 */
const addKeyValuePairs = (doc, pairs) => {
  doc.fontSize(10);

  pairs.forEach(([key, value]) => {
    doc.fillColor(COLORS.lightText)
       .text(`${key}: `, { continued: true })
       .fillColor(COLORS.text)
       .text(value !== null && value !== undefined ? String(value) : '-');
  });

  doc.moveDown(0.5);
};

/**
 * Add a summary box
 */
const addSummaryBox = (doc, title, items) => {
  const startY = doc.y;
  const boxWidth = 150;
  const boxHeight = 60;
  const startX = 50;

  items.forEach((item, index) => {
    const x = startX + (index * (boxWidth + 20));

    // Box background
    doc.rect(x, startY, boxWidth, boxHeight)
       .fillAndStroke(COLORS.background, COLORS.border);

    // Value
    doc.fontSize(20)
       .fillColor(COLORS.primary)
       .text(String(item.value), x + 10, startY + 10, { width: boxWidth - 20, align: 'center' });

    // Label
    doc.fontSize(9)
       .fillColor(COLORS.lightText)
       .text(item.label, x + 10, startY + 38, { width: boxWidth - 20, align: 'center' });
  });

  doc.y = startY + boxHeight + 20;
};

/**
 * Add footer with page numbers
 */
const addFooter = (doc) => {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    // Footer line
    doc.strokeColor(COLORS.border)
       .lineWidth(0.5)
       .moveTo(50, doc.page.height - 40)
       .lineTo(doc.page.width - 50, doc.page.height - 40)
       .stroke();

    // Page number
    doc.fontSize(8)
       .fillColor(COLORS.lightText)
       .text(
         `Page ${i + 1} of ${pages.count}`,
         50,
         doc.page.height - 30,
         { align: 'center', width: doc.page.width - 100 }
       );

    // Powered by
    doc.text(
      'VroomX Safety - FMCSA Compliance Platform',
      50,
      doc.page.height - 30,
      { align: 'right', width: doc.page.width - 100 }
    );
  }
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  if (!date) return '-';
  try {
    const parsed = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(parsed) || isNaN(parsed.getTime())) return '-';
    return format(parsed, 'MM/dd/yyyy');
  } catch {
    return '-';
  }
};

/**
 * Get status color
 */
const getStatusColor = (status) => {
  const statusLower = String(status).toLowerCase();
  if (statusLower === 'compliant' || statusLower === 'active' || statusLower === 'valid') {
    return '#16A34A'; // Green
  } else if (statusLower === 'expiring' || statusLower === 'warning' || statusLower === 'due_soon') {
    return '#CA8A04'; // Yellow
  } else if (statusLower === 'expired' || statusLower === 'non-compliant' || statusLower === 'invalid') {
    return '#DC2626'; // Red
  }
  return COLORS.text;
};

module.exports = {
  createDocument,
  addHeader,
  addSectionTitle,
  addTable,
  addKeyValuePairs,
  addSummaryBox,
  addFooter,
  formatDate,
  getStatusColor,
  COLORS
};
