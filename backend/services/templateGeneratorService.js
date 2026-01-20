const ejs = require('ejs');
const path = require('path');
const fs = require('fs').promises;
const puppeteer = require('puppeteer');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

// Available template definitions
const TEMPLATE_DEFINITIONS = {
  driver_employment_application: {
    name: 'Driver Employment Application',
    description: 'Standard employment application form for CDL drivers per 49 CFR 391.21',
    regulation: '49 CFR 391.21',
    category: 'driver',
    fields: [
      { key: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
      { key: 'applicantAddress', label: 'Address', type: 'text', required: true },
      { key: 'applicantCity', label: 'City', type: 'text', required: true },
      { key: 'applicantState', label: 'State', type: 'text', required: true },
      { key: 'applicantZip', label: 'ZIP', type: 'text', required: true },
      { key: 'applicantPhone', label: 'Phone', type: 'text', required: true },
      { key: 'applicantEmail', label: 'Email', type: 'email', required: false },
      { key: 'applicantDOB', label: 'Date of Birth', type: 'date', required: true },
      { key: 'applicantSSN', label: 'Social Security Number', type: 'text', required: true },
      { key: 'cdlNumber', label: 'CDL Number', type: 'text', required: true },
      { key: 'cdlState', label: 'CDL State', type: 'text', required: true },
      { key: 'cdlClass', label: 'CDL Class', type: 'select', options: ['A', 'B', 'C'], required: true },
      { key: 'cdlExpiration', label: 'CDL Expiration', type: 'date', required: true },
      { key: 'endorsements', label: 'Endorsements', type: 'multiselect', options: ['H', 'N', 'P', 'S', 'T', 'X'], required: false },
      { key: 'positionApplied', label: 'Position Applied For', type: 'text', required: true }
    ]
  },
  company_safety_policy: {
    name: 'Company Safety Policy',
    description: 'Comprehensive safety policy document for motor carriers',
    regulation: 'General FMCSA Compliance',
    category: 'company',
    fields: [
      { key: 'policyVersion', label: 'Policy Version', type: 'text', required: false, default: '1.0' },
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { key: 'safetyDirectorName', label: 'Safety Director Name', type: 'text', required: true },
      { key: 'safetyDirectorTitle', label: 'Safety Director Title', type: 'text', required: false, default: 'Safety Director' },
      { key: 'safetyDirectorPhone', label: 'Safety Director Phone', type: 'text', required: true },
      { key: 'safetyDirectorEmail', label: 'Safety Director Email', type: 'email', required: true }
    ]
  },
  drug_alcohol_policy: {
    name: 'Drug & Alcohol Policy',
    description: 'DOT-compliant drug and alcohol testing policy per 49 CFR Part 382',
    regulation: '49 CFR Part 382',
    category: 'drug_alcohol',
    fields: [
      { key: 'policyVersion', label: 'Policy Version', type: 'text', required: false, default: '1.0' },
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { key: 'derpName', label: 'DER Name', type: 'text', required: true },
      { key: 'derpTitle', label: 'DER Title', type: 'text', required: false, default: 'Designated Employer Representative' },
      { key: 'derpPhone', label: 'DER Phone', type: 'text', required: true },
      { key: 'derpEmail', label: 'DER Email', type: 'email', required: true },
      { key: 'sapName', label: 'SAP Name', type: 'text', required: false },
      { key: 'sapPhone', label: 'SAP Phone', type: 'text', required: false },
      { key: 'mroName', label: 'MRO Name', type: 'text', required: false },
      { key: 'mroPhone', label: 'MRO Phone', type: 'text', required: false },
      { key: 'collectionSiteName', label: 'Collection Site', type: 'text', required: false },
      { key: 'collectionSiteAddress', label: 'Collection Site Address', type: 'text', required: false },
      { key: 'consortiumName', label: 'Consortium/TPA Name', type: 'text', required: false },
      { key: 'randomRate', label: 'Random Testing Rate (%)', type: 'number', required: false, default: '50' }
    ]
  },
  owner_operator_lease: {
    name: 'Owner-Operator Lease Agreement',
    description: 'Equipment lease agreement for owner-operators per 49 CFR 376',
    regulation: '49 CFR 376',
    category: 'company',
    fields: [
      { key: 'leaseStartDate', label: 'Lease Start Date', type: 'date', required: true },
      { key: 'leaseEndDate', label: 'Lease End Date', type: 'date', required: false },
      { key: 'ownerOperatorName', label: 'Owner-Operator Name', type: 'text', required: true },
      { key: 'ownerOperatorAddress', label: 'Owner-Operator Address', type: 'text', required: true },
      { key: 'ownerOperatorCity', label: 'City', type: 'text', required: true },
      { key: 'ownerOperatorState', label: 'State', type: 'text', required: true },
      { key: 'ownerOperatorZip', label: 'ZIP', type: 'text', required: true },
      { key: 'ownerOperatorPhone', label: 'Phone', type: 'text', required: true },
      { key: 'ownerOperatorEmail', label: 'Email', type: 'email', required: false },
      { key: 'equipmentYear', label: 'Equipment Year', type: 'text', required: true },
      { key: 'equipmentMake', label: 'Equipment Make', type: 'text', required: true },
      { key: 'equipmentModel', label: 'Equipment Model', type: 'text', required: true },
      { key: 'equipmentVin', label: 'Equipment VIN', type: 'text', required: true },
      { key: 'equipmentUnitNumber', label: 'Unit Number', type: 'text', required: false },
      { key: 'compensationRate', label: 'Compensation Rate (%)', type: 'number', required: true },
      { key: 'escrowAmount', label: 'Escrow Amount ($)', type: 'number', required: false },
      { key: 'chargebackItems', label: 'Chargeback Items', type: 'textarea', required: false }
    ]
  },
  driver_road_test: {
    name: 'Driver Road Test Certificate',
    description: 'Road test certification form per 49 CFR 391.31',
    regulation: '49 CFR 391.31',
    category: 'driver',
    fields: [
      { key: 'driverName', label: 'Driver Name', type: 'text', required: true },
      { key: 'cdlNumber', label: 'CDL Number', type: 'text', required: true },
      { key: 'testDate', label: 'Test Date', type: 'date', required: true },
      { key: 'examinerName', label: 'Examiner Name', type: 'text', required: true },
      { key: 'examinerTitle', label: 'Examiner Title', type: 'text', required: false },
      { key: 'vehicleType', label: 'Vehicle Type', type: 'text', required: true },
      { key: 'vehicleUnit', label: 'Vehicle Unit Number', type: 'text', required: true },
      { key: 'testResult', label: 'Test Result', type: 'select', options: ['Pass', 'Fail'], required: true },
      { key: 'testNotes', label: 'Test Notes', type: 'textarea', required: false }
    ]
  }
};

const templateGeneratorService = {
  /**
   * Get list of available templates
   */
  getAvailableTemplates() {
    return Object.entries(TEMPLATE_DEFINITIONS).map(([key, def]) => ({
      key,
      name: def.name,
      description: def.description,
      regulation: def.regulation,
      category: def.category,
      fieldCount: def.fields.length
    }));
  },

  /**
   * Get template definition with all fields
   */
  getTemplateDefinition(templateKey) {
    const definition = TEMPLATE_DEFINITIONS[templateKey];
    if (!definition) {
      throw new Error(`Template '${templateKey}' not found`);
    }
    return {
      key: templateKey,
      ...definition
    };
  },

  /**
   * Generate HTML preview of a template
   */
  async generatePreview(templateKey, data, company) {
    const definition = TEMPLATE_DEFINITIONS[templateKey];
    if (!definition) {
      throw new Error(`Template '${templateKey}' not found`);
    }

    // Merge company data with provided data
    const templateData = {
      company: {
        name: company.name || 'Company Name',
        dotNumber: company.dotNumber || 'DOT#',
        mcNumber: company.mcNumber || '',
        address: company.address || {},
        phone: company.phone || '',
        email: company.email || ''
      },
      ...data,
      generatedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    // Generate HTML from template
    const html = await this._renderTemplate(templateKey, templateData);

    return {
      html,
      templateKey,
      templateName: definition.name
    };
  },

  /**
   * Generate PDF from template
   */
  async generatePDF(templateKey, data, company) {
    const { html } = await this.generatePreview(templateKey, data, company);

    // Use Puppeteer to generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'Letter',
        margin: {
          top: '0.75in',
          right: '0.75in',
          bottom: '0.75in',
          left: '0.75in'
        },
        printBackground: true
      });

      return {
        buffer: pdfBuffer,
        filename: `${templateKey}_${Date.now()}.pdf`,
        contentType: 'application/pdf'
      };
    } finally {
      await browser.close();
    }
  },

  /**
   * Render a template to HTML
   */
  async _renderTemplate(templateKey, data) {
    // Try to load custom template file, fall back to inline template
    const templatePath = path.join(TEMPLATES_DIR, `${templateKey}.ejs`);

    try {
      await fs.access(templatePath);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      return ejs.render(templateContent, data);
    } catch {
      // Use inline template
      return this._getInlineTemplate(templateKey, data);
    }
  },

  /**
   * Get inline HTML template (fallback when no EJS file exists)
   */
  _getInlineTemplate(templateKey, data) {
    const baseStyles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
        .document { max-width: 8.5in; margin: 0 auto; padding: 0.5in; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #1e3a5f; }
        .company-name { font-size: 24pt; font-weight: bold; color: #1e3a5f; margin-bottom: 5px; }
        .company-info { font-size: 10pt; color: #666; }
        .document-title { font-size: 16pt; font-weight: bold; color: #1e3a5f; margin: 20px 0; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
        .regulation-ref { font-size: 9pt; color: #888; text-align: center; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 12pt; font-weight: bold; color: #1e3a5f; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd; }
        .field-row { display: flex; margin-bottom: 10px; }
        .field-label { font-weight: 600; color: #555; width: 180px; flex-shrink: 0; }
        .field-value { flex: 1; border-bottom: 1px solid #ccc; min-height: 20px; padding-bottom: 2px; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-block { width: 45%; }
        .signature-line { border-bottom: 1px solid #333; margin-bottom: 5px; height: 40px; }
        .signature-label { font-size: 9pt; color: #666; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 9pt; color: #888; }
        .checkbox-list { list-style: none; }
        .checkbox-list li { margin-bottom: 8px; }
        .checkbox-list li::before { content: '\\2610'; margin-right: 10px; font-size: 14pt; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f7fa; font-weight: 600; color: #1e3a5f; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .mt-20 { margin-top: 20px; }
        .mb-20 { margin-bottom: 20px; }
        .paragraph { text-align: justify; margin-bottom: 15px; }
      </style>
    `;

    const header = `
      <div class="header">
        <div class="company-name">${data.company.name}</div>
        <div class="company-info">
          DOT# ${data.company.dotNumber}${data.company.mcNumber ? ` | MC# ${data.company.mcNumber}` : ''}
          ${data.company.address?.street ? `<br>${data.company.address.street}, ${data.company.address.city}, ${data.company.address.state} ${data.company.address.zip}` : ''}
          ${data.company.phone ? `<br>Phone: ${data.company.phone}` : ''}
          ${data.company.email ? ` | Email: ${data.company.email}` : ''}
        </div>
      </div>
    `;

    const footer = `
      <div class="footer">
        Generated on ${data.generatedDate} | This document was generated using VroomX Safety Compliance System
      </div>
    `;

    // Template-specific content
    const templates = {
      driver_employment_application: `
        <!DOCTYPE html>
        <html>
        <head><title>Driver Employment Application</title>${baseStyles}</head>
        <body>
          <div class="document">
            ${header}
            <div class="document-title">Driver Employment Application</div>
            <div class="regulation-ref">Per 49 CFR 391.21</div>

            <div class="section">
              <div class="section-title">Personal Information</div>
              <div class="field-row"><span class="field-label">Full Name:</span><span class="field-value">${data.applicantName || ''}</span></div>
              <div class="field-row"><span class="field-label">Address:</span><span class="field-value">${data.applicantAddress || ''}</span></div>
              <div class="field-row"><span class="field-label">City, State, ZIP:</span><span class="field-value">${data.applicantCity || ''}, ${data.applicantState || ''} ${data.applicantZip || ''}</span></div>
              <div class="field-row"><span class="field-label">Phone:</span><span class="field-value">${data.applicantPhone || ''}</span></div>
              <div class="field-row"><span class="field-label">Email:</span><span class="field-value">${data.applicantEmail || ''}</span></div>
              <div class="field-row"><span class="field-label">Date of Birth:</span><span class="field-value">${data.applicantDOB || ''}</span></div>
              <div class="field-row"><span class="field-label">Social Security #:</span><span class="field-value">${data.applicantSSN || ''}</span></div>
            </div>

            <div class="section">
              <div class="section-title">License Information</div>
              <div class="field-row"><span class="field-label">CDL Number:</span><span class="field-value">${data.cdlNumber || ''}</span></div>
              <div class="field-row"><span class="field-label">Issuing State:</span><span class="field-value">${data.cdlState || ''}</span></div>
              <div class="field-row"><span class="field-label">CDL Class:</span><span class="field-value">${data.cdlClass || ''}</span></div>
              <div class="field-row"><span class="field-label">Expiration Date:</span><span class="field-value">${data.cdlExpiration || ''}</span></div>
              <div class="field-row"><span class="field-label">Endorsements:</span><span class="field-value">${Array.isArray(data.endorsements) ? data.endorsements.join(', ') : (data.endorsements || '')}</span></div>
            </div>

            <div class="section">
              <div class="section-title">Position Information</div>
              <div class="field-row"><span class="field-label">Position Applied For:</span><span class="field-value">${data.positionApplied || ''}</span></div>
            </div>

            <div class="section">
              <div class="section-title">Certification</div>
              <p class="paragraph">I certify that the information provided on this application is true and complete to the best of my knowledge. I understand that any falsification or misrepresentation of information may result in denial of employment or discharge.</p>
              <p class="paragraph">I authorize ${data.company.name} to make inquiries about my driving record, employment history, and other relevant information as required by 49 CFR 391.23.</p>
            </div>

            <div class="signature-section">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Applicant Signature</div>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Date</div>
              </div>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `,

      company_safety_policy: `
        <!DOCTYPE html>
        <html>
        <head><title>Company Safety Policy</title>${baseStyles}</head>
        <body>
          <div class="document">
            ${header}
            <div class="document-title">Company Safety Policy</div>
            <div class="regulation-ref">FMCSA Compliance</div>

            <div class="section">
              <div class="field-row"><span class="field-label">Policy Version:</span><span class="field-value">${data.policyVersion || '1.0'}</span></div>
              <div class="field-row"><span class="field-label">Effective Date:</span><span class="field-value">${data.effectiveDate || ''}</span></div>
            </div>

            <div class="section">
              <div class="section-title">1. Policy Statement</div>
              <p class="paragraph">${data.company.name} is committed to providing a safe working environment for all employees and ensuring the safety of the motoring public. This policy establishes the safety standards and procedures that all employees must follow.</p>
            </div>

            <div class="section">
              <div class="section-title">2. Management Commitment</div>
              <p class="paragraph">Management is committed to allocating the necessary resources to implement and maintain this safety program. All levels of management are responsible for ensuring compliance with this policy.</p>
            </div>

            <div class="section">
              <div class="section-title">3. Driver Responsibilities</div>
              <ul class="checkbox-list">
                <li>Comply with all DOT regulations and company policies</li>
                <li>Complete required pre-trip and post-trip inspections</li>
                <li>Report all accidents, incidents, and safety concerns immediately</li>
                <li>Maintain valid CDL and medical certificate</li>
                <li>Follow hours of service regulations</li>
                <li>Operate vehicles in a safe and professional manner</li>
              </ul>
            </div>

            <div class="section">
              <div class="section-title">4. Vehicle Safety</div>
              <p class="paragraph">All vehicles must be maintained in safe operating condition. Drivers must complete pre-trip and post-trip inspections as required by 49 CFR 396.11 and 396.13.</p>
            </div>

            <div class="section">
              <div class="section-title">5. Accident Reporting</div>
              <p class="paragraph">All accidents, regardless of severity, must be reported immediately to the Safety Director. Failure to report an accident is grounds for disciplinary action up to and including termination.</p>
            </div>

            <div class="section">
              <div class="section-title">6. Safety Contact Information</div>
              <div class="field-row"><span class="field-label">Safety Director:</span><span class="field-value">${data.safetyDirectorName || ''}</span></div>
              <div class="field-row"><span class="field-label">Title:</span><span class="field-value">${data.safetyDirectorTitle || 'Safety Director'}</span></div>
              <div class="field-row"><span class="field-label">Phone:</span><span class="field-value">${data.safetyDirectorPhone || ''}</span></div>
              <div class="field-row"><span class="field-label">Email:</span><span class="field-value">${data.safetyDirectorEmail || ''}</span></div>
            </div>

            <div class="signature-section mt-20">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Company Representative</div>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Date</div>
              </div>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `,

      drug_alcohol_policy: `
        <!DOCTYPE html>
        <html>
        <head><title>Drug & Alcohol Policy</title>${baseStyles}</head>
        <body>
          <div class="document">
            ${header}
            <div class="document-title">Drug & Alcohol Policy</div>
            <div class="regulation-ref">Per 49 CFR Part 382</div>

            <div class="section">
              <div class="field-row"><span class="field-label">Policy Version:</span><span class="field-value">${data.policyVersion || '1.0'}</span></div>
              <div class="field-row"><span class="field-label">Effective Date:</span><span class="field-value">${data.effectiveDate || ''}</span></div>
            </div>

            <div class="section">
              <div class="section-title">1. Purpose</div>
              <p class="paragraph">This policy establishes ${data.company.name}'s drug and alcohol testing program in compliance with the U.S. Department of Transportation (DOT) regulations as specified in 49 CFR Part 382.</p>
            </div>

            <div class="section">
              <div class="section-title">2. Scope</div>
              <p class="paragraph">This policy applies to all drivers who operate commercial motor vehicles (CMVs) requiring a CDL as defined by 49 CFR Part 383.</p>
            </div>

            <div class="section">
              <div class="section-title">3. Prohibited Conduct</div>
              <ul class="checkbox-list">
                <li>Use of alcohol within 4 hours of performing safety-sensitive functions</li>
                <li>Use of alcohol or being under the influence while performing safety-sensitive functions</li>
                <li>Use of controlled substances without a valid prescription</li>
                <li>Refusal to submit to required testing</li>
                <li>Possession of alcohol or controlled substances while on duty</li>
              </ul>
            </div>

            <div class="section">
              <div class="section-title">4. Testing Requirements</div>
              <p class="paragraph">Drivers are subject to the following types of testing:</p>
              <ul class="checkbox-list">
                <li>Pre-employment testing</li>
                <li>Reasonable suspicion testing</li>
                <li>Post-accident testing</li>
                <li>Random testing (${data.randomRate || '50'}% annual rate)</li>
                <li>Return-to-duty testing</li>
                <li>Follow-up testing</li>
              </ul>
            </div>

            <div class="section">
              <div class="section-title">5. Consequences of Violations</div>
              <p class="paragraph">Any driver who tests positive, refuses to test, or otherwise violates this policy will be immediately removed from safety-sensitive functions and referred to a Substance Abuse Professional (SAP).</p>
            </div>

            <div class="section">
              <div class="section-title">6. Program Contacts</div>
              <table>
                <tr><th>Role</th><th>Name</th><th>Phone</th></tr>
                <tr><td>Designated Employer Representative (DER)</td><td>${data.derpName || ''}</td><td>${data.derpPhone || ''}</td></tr>
                <tr><td>Medical Review Officer (MRO)</td><td>${data.mroName || ''}</td><td>${data.mroPhone || ''}</td></tr>
                <tr><td>Substance Abuse Professional (SAP)</td><td>${data.sapName || ''}</td><td>${data.sapPhone || ''}</td></tr>
                <tr><td>Collection Site</td><td>${data.collectionSiteName || ''}</td><td></td></tr>
                <tr><td>Consortium/TPA</td><td>${data.consortiumName || ''}</td><td></td></tr>
              </table>
            </div>

            <div class="section mt-20">
              <div class="section-title">Employee Acknowledgment</div>
              <p class="paragraph">I acknowledge that I have received a copy of ${data.company.name}'s Drug & Alcohol Policy. I understand and agree to comply with all requirements of this policy.</p>
            </div>

            <div class="signature-section">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Employee Signature</div>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Date</div>
              </div>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `,

      owner_operator_lease: `
        <!DOCTYPE html>
        <html>
        <head><title>Owner-Operator Lease Agreement</title>${baseStyles}</head>
        <body>
          <div class="document">
            ${header}
            <div class="document-title">Owner-Operator Lease Agreement</div>
            <div class="regulation-ref">Per 49 CFR 376</div>

            <div class="section">
              <p class="paragraph">This Lease Agreement ("Agreement") is entered into as of ${data.leaseStartDate || '_____________'} between:</p>
              <p class="paragraph"><strong>CARRIER:</strong> ${data.company.name}, DOT# ${data.company.dotNumber}</p>
              <p class="paragraph"><strong>OWNER-OPERATOR:</strong> ${data.ownerOperatorName || '_____________'}</p>
            </div>

            <div class="section">
              <div class="section-title">1. Equipment Description</div>
              <table>
                <tr><th>Year</th><th>Make</th><th>Model</th><th>VIN</th><th>Unit #</th></tr>
                <tr>
                  <td>${data.equipmentYear || ''}</td>
                  <td>${data.equipmentMake || ''}</td>
                  <td>${data.equipmentModel || ''}</td>
                  <td>${data.equipmentVin || ''}</td>
                  <td>${data.equipmentUnitNumber || ''}</td>
                </tr>
              </table>
            </div>

            <div class="section">
              <div class="section-title">2. Term</div>
              <p class="paragraph">This Agreement shall commence on ${data.leaseStartDate || '_____________'} ${data.leaseEndDate ? `and terminate on ${data.leaseEndDate}` : 'and continue until terminated by either party with written notice'}.</p>
            </div>

            <div class="section">
              <div class="section-title">3. Compensation</div>
              <p class="paragraph">Owner-Operator shall receive ${data.compensationRate || '___'}% of the gross revenue for loads hauled under this Agreement.</p>
              ${data.escrowAmount ? `<p class="paragraph">An escrow amount of $${data.escrowAmount} shall be maintained.</p>` : ''}
            </div>

            <div class="section">
              <div class="section-title">4. Exclusive Possession and Control</div>
              <p class="paragraph">During the term of this lease, the Carrier shall have exclusive possession, control, and use of the equipment. The equipment shall be operated under the Carrier's authority and display the Carrier's identification.</p>
            </div>

            <div class="section">
              <div class="section-title">5. Insurance</div>
              <p class="paragraph">Carrier shall provide primary liability insurance coverage as required by law. Owner-Operator is responsible for physical damage insurance on the equipment.</p>
            </div>

            <div class="section">
              <div class="section-title">6. Compliance</div>
              <p class="paragraph">Owner-Operator agrees to comply with all applicable federal, state, and local laws and regulations, including but not limited to the Federal Motor Carrier Safety Regulations.</p>
            </div>

            ${data.chargebackItems ? `
            <div class="section">
              <div class="section-title">7. Chargebacks</div>
              <p class="paragraph">${data.chargebackItems}</p>
            </div>
            ` : ''}

            <div class="section mt-20">
              <p class="paragraph"><strong>IN WITNESS WHEREOF</strong>, the parties have executed this Agreement as of the date first written above.</p>
            </div>

            <div class="signature-section">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Carrier Representative</div>
                <div class="signature-line mt-20"></div>
                <div class="signature-label">Date</div>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Owner-Operator</div>
                <div class="signature-line mt-20"></div>
                <div class="signature-label">Date</div>
              </div>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `,

      driver_road_test: `
        <!DOCTYPE html>
        <html>
        <head><title>Driver Road Test Certificate</title>${baseStyles}</head>
        <body>
          <div class="document">
            ${header}
            <div class="document-title">Driver Road Test Certificate</div>
            <div class="regulation-ref">Per 49 CFR 391.31</div>

            <div class="section">
              <div class="section-title">Driver Information</div>
              <div class="field-row"><span class="field-label">Driver Name:</span><span class="field-value">${data.driverName || ''}</span></div>
              <div class="field-row"><span class="field-label">CDL Number:</span><span class="field-value">${data.cdlNumber || ''}</span></div>
            </div>

            <div class="section">
              <div class="section-title">Test Information</div>
              <div class="field-row"><span class="field-label">Test Date:</span><span class="field-value">${data.testDate || ''}</span></div>
              <div class="field-row"><span class="field-label">Vehicle Type:</span><span class="field-value">${data.vehicleType || ''}</span></div>
              <div class="field-row"><span class="field-label">Unit Number:</span><span class="field-value">${data.vehicleUnit || ''}</span></div>
            </div>

            <div class="section">
              <div class="section-title">Skills Evaluated</div>
              <table>
                <tr><th>Skill</th><th>Satisfactory</th><th>Unsatisfactory</th></tr>
                <tr><td>Pre-trip inspection</td><td class="text-center">&#9744;</td><td class="text-center">&#9744;</td></tr>
                <tr><td>Coupling and uncoupling</td><td class="text-center">&#9744;</td><td class="text-center">&#9744;</td></tr>
                <tr><td>Placing vehicle in operation</td><td class="text-center">&#9744;</td><td class="text-center">&#9744;</td></tr>
                <tr><td>Use of vehicle controls</td><td class="text-center">&#9744;</td><td class="text-center">&#9744;</td></tr>
                <tr><td>Operating in traffic</td><td class="text-center">&#9744;</td><td class="text-center">&#9744;</td></tr>
                <tr><td>Turning</td><td class="text-center">&#9744;</td><td class="text-center">&#9744;</td></tr>
                <tr><td>Braking and slowing</td><td class="text-center">&#9744;</td><td class="text-center">&#9744;</td></tr>
                <tr><td>Backing and parking</td><td class="text-center">&#9744;</td><td class="text-center">&#9744;</td></tr>
              </table>
            </div>

            <div class="section">
              <div class="section-title">Test Result</div>
              <div class="field-row"><span class="field-label">Result:</span><span class="field-value" style="font-weight: bold; ${data.testResult === 'Pass' ? 'color: green;' : 'color: red;'}">${data.testResult || ''}</span></div>
              ${data.testNotes ? `<div class="field-row"><span class="field-label">Notes:</span><span class="field-value">${data.testNotes}</span></div>` : ''}
            </div>

            <div class="section">
              <div class="section-title">Examiner Certification</div>
              <p class="paragraph">I certify that I have tested the above-named driver and that the driver has demonstrated the ability to safely operate the type of vehicle listed above.</p>
              <div class="field-row mt-20"><span class="field-label">Examiner Name:</span><span class="field-value">${data.examinerName || ''}</span></div>
              <div class="field-row"><span class="field-label">Title:</span><span class="field-value">${data.examinerTitle || ''}</span></div>
            </div>

            <div class="signature-section">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Examiner Signature</div>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Date</div>
              </div>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `
    };

    return templates[templateKey] || '<html><body><p>Template not found</p></body></html>';
  },

  /**
   * Validate template data against required fields
   */
  validateTemplateData(templateKey, data) {
    const definition = TEMPLATE_DEFINITIONS[templateKey];
    if (!definition) {
      return { valid: false, errors: ['Template not found'] };
    }

    const errors = [];
    for (const field of definition.fields) {
      if (field.required && !data[field.key]) {
        errors.push(`${field.label} is required`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

module.exports = templateGeneratorService;
