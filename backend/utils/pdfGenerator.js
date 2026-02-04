const PDFDocument = require('pdfkit');
const { format, isValid } = require('date-fns');
const path = require('path');
const fs = require('fs');

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
  background: '#FAFAFA', // Zinc-50
  // Status badge colors
  success: '#16A34A', // Green-600
  successBg: '#DCFCE7', // Green-100
  warning: '#CA8A04', // Yellow-600
  warningBg: '#FEF3C7', // Yellow-100
  danger: '#DC2626', // Red-600
  dangerBg: '#FEE2E2', // Red-100
  // Zebra stripe color
  zebraStripe: '#F4F4F5', // Zinc-100
  // Table header
  tableHeader: '#E4E4E7', // Zinc-200
  white: '#FFFFFF'
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
 * @param {PDFDocument} doc - PDF document instance
 * @param {Object} company - Company object with name, dotNumber, and optional logo
 * @param {string} reportTitle - Title of the report
 * @param {Object} options - Optional settings { showLogo: true }
 */
const addHeader = (doc, company, reportTitle, options = {}) => {
  const { showLogo = true } = options;
  const startY = doc.y;
  let textX = 50;
  const logoSize = 50;

  // Try to add company logo if available and showLogo is true
  if (showLogo && company.logo) {
    try {
      const logoPath = company.logo.startsWith('/')
        ? path.join(process.cwd(), company.logo)
        : company.logo;

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, startY, {
          width: logoSize,
          height: logoSize,
          fit: [logoSize, logoSize]
        });
        textX = 50 + logoSize + 15; // Logo width + padding
      }
    } catch (err) {
      // Logo failed to load, continue without it
    }
  }

  // Company name
  doc.fontSize(20)
     .fillColor(COLORS.primary)
     .text(company.name || 'Company Report', textX, startY, { align: 'left' });

  // DOT Number
  if (company.dotNumber) {
    doc.fontSize(10)
       .fillColor(COLORS.lightText)
       .text(`DOT# ${company.dotNumber}`, textX, doc.y, { align: 'left' });
  }

  // Generation date - right aligned
  const generatedText = `Generated: ${format(new Date(), 'MM/dd/yyyy h:mm a')} UTC`;
  doc.fontSize(9)
     .fillColor(COLORS.lightText)
     .text(generatedText, doc.page.width - 50 - 180, startY + 5, {
       width: 180,
       align: 'right'
     });

  // Ensure we're below the logo if present
  const headerBottom = showLogo && company.logo ? startY + logoSize + 10 : doc.y + 10;
  doc.y = Math.max(doc.y, headerBottom);

  doc.moveDown(1);

  // Report title
  doc.fontSize(16)
     .fillColor(COLORS.secondary)
     .text(reportTitle, 50, doc.y, { align: 'left' });

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
 * Get badge colors based on status value
 */
const getBadgeColors = (status) => {
  const statusLower = String(status).toLowerCase();

  // Success states (green)
  if (['compliant', 'active', 'valid', 'complete', 'completed', 'approved', 'accepted', 'negative', 'passed'].includes(statusLower)) {
    return { bg: COLORS.successBg, text: COLORS.success };
  }

  // Warning states (yellow)
  if (['expiring', 'warning', 'due_soon', 'pending', 'under_review', 'in_progress'].includes(statusLower)) {
    return { bg: COLORS.warningBg, text: COLORS.warning };
  }

  // Danger states (red)
  if (['expired', 'non-compliant', 'invalid', 'overdue', 'failed', 'denied', 'positive', 'refused'].includes(statusLower)) {
    return { bg: COLORS.dangerBg, text: COLORS.danger };
  }

  // Default (neutral gray)
  return { bg: COLORS.background, text: COLORS.text };
};

/**
 * Format status text for display (capitalize, replace underscores)
 */
const formatStatusText = (status) => {
  if (!status || status === '-') return status;
  return String(status)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Add a status badge (pill-shaped) to the document
 * @param {PDFDocument} doc - PDF document instance
 * @param {string} status - Status value
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} options - { width, height }
 */
const addStatusBadge = (doc, status, x, y, options = {}) => {
  const { width = 70, height = 16 } = options;
  const displayText = formatStatusText(status);
  const colors = getBadgeColors(status);
  const radius = height / 2;

  // Save current state
  doc.save();

  // Draw pill-shaped background using roundedRect
  doc.roundedRect(x, y, width, height, radius)
     .fill(colors.bg);

  // Add text centered in badge
  doc.fontSize(8)
     .fillColor(colors.text)
     .text(displayText, x, y + 4, {
       width: width,
       align: 'center'
     });

  // Restore state
  doc.restore();
};

/**
 * Add a table with optional zebra striping and status badges
 * @param {PDFDocument} doc - PDF document instance
 * @param {Array} headers - Column headers
 * @param {Array} rows - Data rows (2D array)
 * @param {Array} columnWidths - Column widths (optional)
 * @param {Object} options - { zebraStripe: false, statusColumn: -1 }
 *   - zebraStripe: true to enable alternating row backgrounds
 *   - statusColumn: column index to render as status badge (-1 to disable, 'auto' to auto-detect)
 */
const addTable = (doc, headers, rows, columnWidths, options = {}) => {
  const { zebraStripe = false, statusColumn = -1 } = options;
  const startX = 50;
  const startY = doc.y;
  const rowHeight = statusColumn !== -1 ? 25 : 20; // Taller rows for badges
  const headerHeight = 22;
  const tableWidth = doc.page.width - 100;

  // Calculate column widths if not provided
  if (!columnWidths) {
    const colWidth = tableWidth / headers.length;
    columnWidths = headers.map(() => colWidth);
  }

  // Auto-detect status column if set to 'auto'
  let effectiveStatusColumn = statusColumn;
  if (statusColumn === 'auto') {
    effectiveStatusColumn = headers.findIndex(h =>
      /status|state|result|outcome/i.test(h)
    );
  }

  // Draw header row background
  doc.rect(startX, startY, tableWidth, headerHeight)
     .fill(COLORS.tableHeader);

  // Header text
  doc.fontSize(9)
     .fillColor(COLORS.secondary);

  let x = startX;
  headers.forEach((header, i) => {
    doc.text(header, x + 5, startY + 6, { width: columnWidths[i] - 10, align: 'left' });
    x += columnWidths[i];
  });

  // Header bottom border
  doc.strokeColor(COLORS.border)
     .lineWidth(1)
     .moveTo(startX, startY + headerHeight)
     .lineTo(startX + tableWidth, startY + headerHeight)
     .stroke();

  // Data rows
  let y = startY + headerHeight;

  rows.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;

      // Redraw header on new page
      doc.rect(startX, y, tableWidth, headerHeight)
         .fill(COLORS.tableHeader);

      doc.fontSize(9)
         .fillColor(COLORS.secondary);

      let hx = startX;
      headers.forEach((header, i) => {
        doc.text(header, hx + 5, y + 6, { width: columnWidths[i] - 10, align: 'left' });
        hx += columnWidths[i];
      });

      doc.strokeColor(COLORS.border)
         .lineWidth(1)
         .moveTo(startX, y + headerHeight)
         .lineTo(startX + tableWidth, y + headerHeight)
         .stroke();

      y += headerHeight;
    }

    // Zebra stripe background for alternating rows
    if (zebraStripe && rowIndex % 2 === 1) {
      doc.rect(startX, y, tableWidth, rowHeight)
         .fill(COLORS.zebraStripe);
    }

    // Row border
    doc.strokeColor(COLORS.border)
       .lineWidth(0.5)
       .moveTo(startX, y + rowHeight)
       .lineTo(startX + tableWidth, y + rowHeight)
       .stroke();

    // Cell content
    x = startX;
    row.forEach((cell, i) => {
      const cellText = cell !== null && cell !== undefined ? String(cell) : '-';

      if (i === effectiveStatusColumn && cellText !== '-') {
        // Render as status badge
        const badgeWidth = Math.min(columnWidths[i] - 10, 80);
        addStatusBadge(doc, cellText, x + 5, y + 4, { width: badgeWidth, height: 16 });
      } else {
        // Regular text
        doc.fontSize(9)
           .fillColor(COLORS.text)
           .text(cellText, x + 5, y + 6, { width: columnWidths[i] - 10, align: 'left' });
      }
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
 * Add enhanced summary boxes with shadow effect and accent bar
 * @param {PDFDocument} doc - PDF document instance
 * @param {string} title - Section title (optional, can be empty)
 * @param {Array} items - Array of { value, label, color? }
 */
const addSummaryBox = (doc, title, items) => {
  const startY = doc.y;
  const boxWidth = 130;
  const boxHeight = 70;
  const startX = 50;
  const accentHeight = 4;
  const shadowOffset = 2;

  // Calculate total width to center boxes
  const totalWidth = (items.length * boxWidth) + ((items.length - 1) * 15);
  const contentWidth = doc.page.width - 100;
  const offsetX = startX + Math.max(0, (contentWidth - totalWidth) / 2);

  items.forEach((item, index) => {
    const x = offsetX + (index * (boxWidth + 15));

    // Shadow effect (subtle gray box offset)
    doc.rect(x + shadowOffset, startY + shadowOffset, boxWidth, boxHeight)
       .fill('#E4E4E7');

    // White box background
    doc.rect(x, startY, boxWidth, boxHeight)
       .fill(COLORS.white);

    // Box border
    doc.rect(x, startY, boxWidth, boxHeight)
       .stroke(COLORS.border);

    // Colored accent bar at top
    const accentColor = item.color || COLORS.primary;
    doc.rect(x, startY, boxWidth, accentHeight)
       .fill(accentColor);

    // Value (larger font)
    doc.fontSize(28)
       .fillColor(item.color || COLORS.primary)
       .text(String(item.value), x + 5, startY + accentHeight + 8, {
         width: boxWidth - 10,
         align: 'center'
       });

    // Label
    doc.fontSize(9)
       .fillColor(COLORS.lightText)
       .text(item.label, x + 5, startY + boxHeight - 18, {
         width: boxWidth - 10,
         align: 'center'
       });
  });

  doc.y = startY + boxHeight + shadowOffset + 20;
};

/**
 * Add footer with page numbers
 */
const addFooter = (doc) => {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    // Save graphics state
    doc.save();

    // Footer line
    doc.strokeColor(COLORS.border)
       .lineWidth(0.5)
       .moveTo(50, doc.page.height - 40)
       .lineTo(doc.page.width - 50, doc.page.height - 40)
       .stroke();

    // Page number (center)
    doc.fontSize(8)
       .fillColor(COLORS.lightText)
       .text(
         `Page ${i + 1} of ${pages.count}`,
         50,
         doc.page.height - 30,
         { align: 'center', width: doc.page.width - 100, lineBreak: false }
       );

    // Powered by (right) - use same Y position
    doc.text(
      'VroomX Safety - FMCSA Compliance Platform',
      50,
      doc.page.height - 30,
      { align: 'right', width: doc.page.width - 100, lineBreak: false }
    );

    // Restore graphics state
    doc.restore();
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
  addStatusBadge,
  getBadgeColors,
  formatStatusText,
  COLORS
};
