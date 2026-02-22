/**
 * PDF Service - Generate PDF reports from HTML templates
 * Uses Puppeteer for high-quality PDF rendering
 */

const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const path = require('path');
const fs = require('fs');

// Check if running in cloud environment
const isCloud = process.env.RENDER || process.env.AWS_LAMBDA_FUNCTION_NAME ||
                process.env.VERCEL || process.env.NODE_ENV === 'production';

// Browser instance for reuse
let browserInstance = null;

const pdfService = {
  /**
   * Get or create browser instance
   */
  async getBrowser() {
    if (browserInstance && browserInstance.isConnected()) {
      return browserInstance;
    }

    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        // SECURITY: Removed --disable-web-security flag to maintain Same-Origin Policy
        '--font-render-hinting=none'
      ]
    };

    if (isCloud) {
      launchOptions.executablePath = await chromium.executablePath();
      launchOptions.args = chromium.args;
      launchOptions.headless = chromium.headless;
    } else {
      // Local development - use system Chrome
      const possiblePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      ];
      launchOptions.executablePath = possiblePaths.find(p => {
        try { return fs.existsSync(p); } catch { return false; }
      });
    }

    browserInstance = await puppeteer.launch(launchOptions);
    return browserInstance;
  },

  /**
   * Generate PDF from HTML content
   * @param {string} html - Full HTML document
   * @param {object} options - PDF options
   * @returns {Buffer} PDF buffer
   */
  async generatePDF(html, options = {}) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Set content with base URL for relative resources
      try {
        await page.setContent(html, {
          waitUntil: 'networkidle0',
          timeout: 60000
        });
      } catch (contentError) {
        throw new Error(`PDF content rendering timed out. The report may be too large. ${contentError.message}`);
      }

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'Letter',
        printBackground: true,
        margin: options.margin || {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        displayHeaderFooter: false,
        preferCSSPageSize: true
      });

      return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
    } finally {
      await page.close();
      // In cloud, close browser to free memory
      if (isCloud && browserInstance) {
        await browserInstance.close();
        browserInstance = null;
      }
    }
  },

  /**
   * Generate CSA Report PDF
   * @param {object} data - Report data
   * @returns {Buffer} PDF buffer
   */
  async generateCSAReport(data) {
    const { carrier, basics, riskLevel, inspections, crashes, aiAnalysis, dataQOpportunities } = data;

    // Load and render template
    const templatePath = path.join(__dirname, '../templates/csa-report-pdf.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Helper to get status color
    const getStatusColor = (score, threshold) => {
      if (score === null || score === undefined) return { bg: '#f3f4f6', text: '#6b7280', label: 'N/A' };
      if (score >= threshold) return { bg: '#fef2f2', text: '#dc2626', label: 'CRITICAL' };
      if (score >= threshold - 10) return { bg: '#fffbeb', text: '#f97316', label: 'WARNING' };
      return { bg: '#f0fdf4', text: '#16a34a', label: 'OK' };
    };

    // Risk level colors
    const riskColors = {
      HIGH: { bg: '#dc2626', text: '#ffffff' },
      MODERATE: { bg: '#f97316', text: '#ffffff' },
      LOW: { bg: '#16a34a', text: '#ffffff' }
    };

    // BASIC thresholds
    const thresholds = {
      unsafeDriving: 65,
      hosCompliance: 65,
      vehicleMaintenance: 80,
      controlledSubstances: 80,
      hazmatCompliance: 80,
      driverFitness: 80,
      crashIndicator: 65
    };

    // BASIC display names
    const basicNames = {
      unsafeDriving: 'Unsafe Driving',
      hosCompliance: 'HOS Compliance',
      vehicleMaintenance: 'Vehicle Maintenance',
      controlledSubstances: 'Controlled Substances',
      hazmatCompliance: 'Hazmat Compliance',
      driverFitness: 'Driver Fitness',
      crashIndicator: 'Crash Indicator'
    };

    // Generate BASIC rows HTML
    let basicsHtml = '';
    for (const [key, name] of Object.entries(basicNames)) {
      const score = basics[key];
      const threshold = thresholds[key];
      const status = getStatusColor(score, threshold);
      const barWidth = score !== null && score !== undefined ? Math.min(score, 100) : 0;

      basicsHtml += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="flex: 1; height: 24px; background: #f3f4f6; border-radius: 4px; overflow: hidden; position: relative;">
                <div style="width: ${barWidth}%; height: 100%; background: ${score >= threshold ? '#dc2626' : score >= threshold - 10 ? '#f97316' : '#16a34a'}; border-radius: 4px;"></div>
                ${threshold ? `<div style="position: absolute; left: ${threshold}%; top: 0; bottom: 0; width: 2px; background: #1f2937;"></div>` : ''}
              </div>
              <span style="font-weight: bold; min-width: 50px; text-align: right;">${score !== null && score !== undefined ? score + '%' : 'N/A'}</span>
            </div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${status.bg}; color: ${status.text};">${status.label}</span>
          </td>
        </tr>
      `;
    }

    // Format AI analysis as structured HTML with improved styling
    // Supports both new plain-text headers and legacy emoji headers
    const formatAiAnalysisHtml = (text) => {
      if (!text) return '<p style="margin: 0; font-size: 14px; color: #6b7280;">No analysis available.</p>';

      const processBold = (str) => str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

      // Section styling — new plain-text headers + legacy emoji headers
      const sectionDefs = [
        { pattern: /^THE BOTTOM LINE$/m, label: 'THE BOTTOM LINE', bg: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)', border: '#eab308', headerColor: '#854d0e', textColor: '#713f12' },
        { pattern: /^WHAT I SEE IN YOUR DATA$/m, label: 'WHAT I SEE IN YOUR DATA', bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '#f59e0b', headerColor: '#92400e', textColor: '#92400e' },
        { pattern: /^WHAT I WOULD DO$/m, label: 'WHAT I WOULD DO', bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', border: '#22c55e', headerColor: '#166534', textColor: '#166534', isAction: true },
        { pattern: /^MOVING VIOLATIONS$/m, label: 'MOVING VIOLATIONS', bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '#7c3aed', headerColor: '#581c87', textColor: '#581c87' },
        { pattern: /^DATAQ OPPORTUNITIES$/m, label: 'DATAQ OPPORTUNITIES', bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '#ea580c', headerColor: '#9a3412', textColor: '#9a3412' },
        // Legacy emoji headers
        { pattern: /^📊\s*QUICK SUMMARY$/m, label: 'QUICK SUMMARY', bg: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)', border: '#eab308', headerColor: '#854d0e', textColor: '#713f12' },
        { pattern: /^⚠️\s*ISSUES FOUND$/m, label: 'ISSUES FOUND', bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '#f59e0b', headerColor: '#92400e', textColor: '#92400e' },
        { pattern: /^✅\s*YOUR 3-STEP ACTION PLAN$/m, label: 'ACTION PLAN', bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', border: '#22c55e', headerColor: '#166534', textColor: '#166534', isAction: true },
        { pattern: /^🔍\s*DATAQ CHALLENGE OPPORTUNITIES$/m, label: 'DATAQ OPPORTUNITIES', bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '#ea580c', headerColor: '#9a3412', textColor: '#9a3412' },
        { pattern: /^⚖️\s*MOVING VIOLATION ALERT$/m, label: 'MOVING VIOLATIONS', bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '#7c3aed', headerColor: '#581c87', textColor: '#581c87' }
      ];

      const splitRegex = new RegExp(
        sectionDefs.map(d => `(?=${d.pattern.source})`).join('|'),
        'm'
      );

      const sections = text.split(splitRegex).filter(s => s.trim());
      let html = '';

      for (const section of sections) {
        const lines = section.trim().split('\n');
        const headerLine = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();

        const def = sectionDefs.find(d => d.pattern.test(headerLine));

        if (def && content) {
          const processed = processBold(content);

          // Action plan sections get numbered step styling
          if (def.isAction) {
            const steps = processed.split('\n').filter(l => l.trim()).map((line, index) => {
              const clean = line.replace(/^\d+\.\s*/, '').replace(/^[•\-]\s*/, '').trim();
              return `
                <li style="margin: 0 0 12px 0; padding: 14px; background: #ffffff; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 14px; color: ${def.textColor}; line-height: 1.6; list-style: none; display: flex; align-items: flex-start; gap: 12px;">
                  <span style="flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; border-radius: 50%; font-weight: bold; font-size: 13px;">${index + 1}</span>
                  <span style="flex: 1;">${clean}</span>
                </li>`;
            }).join('');
            html += `
              <div style="margin-bottom: 20px; padding: 16px; background: ${def.bg}; border-radius: 8px; border-left: 5px solid ${def.border}; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                <p style="margin: 0 0 14px 0; font-size: 14px; font-weight: bold; color: ${def.headerColor}; letter-spacing: 0.5px;">${def.label}</p>
                <ol style="margin: 0; padding: 0;">${steps}</ol>
              </div>`;
          } else {
            // Standard sections: bullets and paragraphs
            const contentHtml = processed.split('\n').filter(l => l.trim()).map(line => {
              const trimmed = line.trim();
              if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                const clean = trimmed.replace(/^[•\-]\s*/, '').trim();
                return `<li style="margin: 10px 0; font-size: 14px; color: ${def.textColor}; line-height: 1.6;">${clean}</li>`;
              }
              if (/^\d+\./.test(trimmed)) {
                const clean = trimmed.replace(/^\d+\.\s*/, '').trim();
                return `<li style="margin: 10px 0; font-size: 14px; color: ${def.textColor}; line-height: 1.6;">${clean}</li>`;
              }
              return `<p style="margin: 0 0 8px 0; font-size: 14px; color: ${def.textColor}; line-height: 1.7;">${trimmed}</p>`;
            }).join('');

            const hasList = contentHtml.includes('<li');
            const wrapped = hasList
              ? `<ul style="margin: 0; padding-left: 24px; list-style-type: disc;">${contentHtml}</ul>`
              : contentHtml;

            html += `
              <div style="margin-bottom: 20px; padding: 16px; background: ${def.bg}; border-radius: 8px; border-left: 5px solid ${def.border}; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: ${def.headerColor}; letter-spacing: 0.5px;">${def.label}</p>
                <div>${wrapped}</div>
              </div>`;
          }
        } else if (section.trim()) {
          html += `<p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">${processBold(section.trim()).replace(/\n/g, '<br>')}</p>`;
        }
      }

      return html || '<p style="margin: 0; font-size: 14px; color: #6b7280;">No analysis available.</p>';
    };

    // Generate DataQ HTML block for PDF
    let dataQHtml = '';
    if (dataQOpportunities?.hasOpportunities && Array.isArray(dataQOpportunities.categories) && dataQOpportunities.categories.length > 0) {
      const categoryRows = dataQOpportunities.categories.map(c => {
        const urgency = c.status === 'flagged' ? 'High Priority' : 'Monitor';
        const urgencyColor = c.status === 'flagged' ? '#dc2626' : '#f97316';
        return `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #fed7aa; font-size: 14px; color: #9a3412;">${c.name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #fed7aa; font-size: 14px; color: #9a3412;">${c.score}% / ${c.threshold}%</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #fed7aa;"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${c.status === 'flagged' ? '#fef2f2' : '#fffbeb'}; color: ${urgencyColor};">${urgency}</span></td>
        </tr>`;
      }).join('');

      dataQHtml = `
        <div class="dataq-box">
          <div class="dataq-title">🔍 DataQ Challenge Opportunities</div>
          <p class="dataq-text" style="margin-bottom: 12px;">We identified <strong>${dataQOpportunities.estimatedCount}</strong> potential violation(s) that may be eligible for a DataQ challenge.</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
            <thead>
              <tr>
                <th style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #9a3412; text-align: left; border-bottom: 2px solid #fed7aa;">Category</th>
                <th style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #9a3412; text-align: left; border-bottom: 2px solid #fed7aa;">Score / Threshold</th>
                <th style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #9a3412; text-align: left; border-bottom: 2px solid #fed7aa;">Urgency</th>
              </tr>
            </thead>
            <tbody>${categoryRows}</tbody>
          </table>
          <p style="font-size: 13px; color: #c2410c; text-align: center;">Visit <strong>vroomxsafety.com/register</strong> to start your DataQ challenges</p>
        </div>`;
    }

    // Replace template variables
    const riskColor = riskColors[riskLevel] || riskColors.MODERATE;
    template = template
      .replace(/{{carrierName}}/g, carrier.legalName || 'Unknown Carrier')
      .replace(/{{dotNumber}}/g, carrier.dotNumber || 'N/A')
      .replace(/{{mcNumber}}/g, carrier.mcNumber || 'N/A')
      .replace(/{{operatingStatus}}/g, carrier.operatingStatus || 'Unknown')
      .replace(/{{fleetSize}}/g, carrier.fleetSize?.powerUnits || 'N/A')
      .replace(/{{riskLevel}}/g, riskLevel)
      .replace(/{{riskBg}}/g, riskColor.bg)
      .replace(/{{riskText}}/g, riskColor.text)
      .replace(/{{basicsRows}}/g, basicsHtml)
      .replace(/{{inspections24}}/g, inspections?.last24Months || 0)
      .replace(/{{crashes24}}/g, crashes?.last24Months || 0)
      .replace(/{{aiAnalysis}}/g, formatAiAnalysisHtml(aiAnalysis))
      .replace(/{{dataQHtml}}/g, dataQHtml)
      .replace(/{{reportDate}}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
      .replace(/{{currentYear}}/g, new Date().getFullYear());

    return this.generatePDF(template);
  }
};

module.exports = pdfService;
