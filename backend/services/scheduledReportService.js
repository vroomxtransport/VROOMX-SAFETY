/**
 * Scheduled Report Service
 *
 * Manages automated report scheduling, generation, and email delivery.
 * Called by cron job every hour to process due reports.
 */

const ScheduledReport = require('../models/ScheduledReport');
const { Driver, Vehicle, Violation, DrugAlcoholTest, Document, Company } = require('../models');
const User = require('../models/User');
const pdf = require('../utils/pdfGenerator');
const emailService = require('./emailService');

const scheduledReportService = {
  /**
   * Create a new scheduled report
   *
   * @param {string} userId - User creating the schedule
   * @param {string} companyId - Company the report is for
   * @param {object} config - Schedule configuration
   * @returns {object} Created schedule
   */
  async createSchedule(userId, companyId, config) {
    const schedule = new ScheduledReport({
      companyId,
      createdBy: userId,
      reportType: config.reportType,
      reportName: config.reportName,
      frequency: config.frequency,
      dayOfWeek: config.dayOfWeek || 1,
      dayOfMonth: config.dayOfMonth || 1,
      time: config.time || '09:00',
      timezone: config.timezone || 'America/New_York',
      recipients: config.recipients || [],
      format: config.format || 'pdf',
      filters: config.filters || {},
      isActive: true
    });

    await schedule.save();
    return schedule;
  },

  /**
   * Update an existing schedule
   *
   * @param {string} scheduleId - Schedule to update
   * @param {string} companyId - Company ID for authorization
   * @param {object} updates - Fields to update
   * @returns {object|null} Updated schedule
   */
  async updateSchedule(scheduleId, companyId, updates) {
    const allowedUpdates = [
      'reportType', 'reportName', 'frequency', 'dayOfWeek', 'dayOfMonth',
      'time', 'timezone', 'recipients', 'format', 'filters', 'isActive'
    ];

    const updateData = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    const schedule = await ScheduledReport.findOneAndUpdate(
      { _id: scheduleId, companyId },
      updateData,
      { new: true, runValidators: true }
    );

    if (schedule) {
      // Recalculate nextRun after update
      schedule.nextRun = schedule.calculateNextRun();
      await schedule.save();
    }

    return schedule;
  },

  /**
   * Delete a schedule (soft delete by setting isActive = false)
   *
   * @param {string} scheduleId - Schedule to delete
   * @param {string} companyId - Company ID for authorization
   * @returns {boolean} Success
   */
  async deleteSchedule(scheduleId, companyId) {
    const result = await ScheduledReport.findOneAndUpdate(
      { _id: scheduleId, companyId },
      { isActive: false },
      { new: true }
    );
    return !!result;
  },

  /**
   * Permanently delete a schedule
   *
   * @param {string} scheduleId - Schedule to delete
   * @param {string} companyId - Company ID for authorization
   * @returns {boolean} Success
   */
  async hardDeleteSchedule(scheduleId, companyId) {
    const result = await ScheduledReport.findOneAndDelete({ _id: scheduleId, companyId });
    return !!result;
  },

  /**
   * Get all schedules for a company
   *
   * @param {string} companyId - Company ID
   * @param {boolean} includeInactive - Include inactive schedules
   * @returns {array} Schedules
   */
  async getSchedulesForCompany(companyId, includeInactive = false) {
    const query = { companyId };
    if (!includeInactive) {
      query.isActive = true;
    }

    return ScheduledReport.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort('-createdAt');
  },

  /**
   * Get a single schedule by ID
   *
   * @param {string} scheduleId - Schedule ID
   * @param {string} companyId - Company ID for authorization
   * @returns {object|null} Schedule
   */
  async getSchedule(scheduleId, companyId) {
    return ScheduledReport.findOne({ _id: scheduleId, companyId })
      .populate('createdBy', 'firstName lastName email')
      .populate('companyId', 'name dotNumber');
  },

  /**
   * Run a scheduled report immediately
   *
   * @param {string} scheduleId - Schedule to run
   * @param {string} companyId - Company ID for authorization
   * @returns {object} Result of report generation
   */
  async runScheduledReport(scheduleId, companyId) {
    const schedule = await ScheduledReport.findOne({ _id: scheduleId, companyId })
      .populate('companyId', 'name dotNumber mcNumber smsBasics');

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    return this.executeReport(schedule);
  },

  /**
   * Execute a report and send via email
   *
   * @param {object} schedule - Schedule document
   * @returns {object} Result
   */
  async executeReport(schedule) {
    const startTime = Date.now();
    let success = false;
    let error = null;

    try {
      // Generate the report PDF
      const pdfBuffer = await this.generateReportPDF(schedule);

      // Get recipients
      let recipients = [...schedule.recipients];

      // If no recipients, send to the creator
      if (recipients.length === 0) {
        const creator = await User.findById(schedule.createdBy);
        if (creator?.email) {
          recipients = [creator.email];
        }
      }

      if (recipients.length === 0) {
        throw new Error('No recipients configured');
      }

      // Send emails to all recipients
      const reportNames = {
        'dqf': 'Driver Qualification Files Report',
        'vehicle-maintenance': 'Vehicle Maintenance Report',
        'violations': 'Violations Summary Report',
        'audit': 'Comprehensive Audit Report',
        'csa': 'CSA/SMS BASICs Report'
      };

      const reportName = schedule.reportName || reportNames[schedule.reportType];
      const company = schedule.companyId;

      for (const recipientEmail of recipients) {
        // Find or create a simple user object for email service
        const recipientUser = await User.findOne({ email: recipientEmail }) || { email: recipientEmail, firstName: 'User' };

        await emailService.send({
          to: recipientEmail,
          subject: `Scheduled Report: ${reportName} - ${company.name}`,
          templateName: 'scheduled-report',
          variables: {
            firstName: recipientUser.firstName || 'User',
            reportName,
            companyName: company.name,
            dotNumber: company.dotNumber,
            frequency: schedule.frequencyDisplay,
            generatedAt: new Date().toLocaleString()
          },
          category: 'report',
          companyId: company._id,
          attachments: pdfBuffer ? [{
            filename: `${reportName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer
          }] : []
        });
      }

      success = true;

      // Update schedule with success
      schedule.lastRun = new Date();
      schedule.lastRunStatus = 'success';
      schedule.lastRunError = null;
      schedule.runCount += 1;
      schedule.nextRun = schedule.calculateNextRun();
      await schedule.save();

      console.log(`[ScheduledReport] Successfully sent ${schedule.reportType} report to ${recipients.length} recipient(s)`);

      return {
        success: true,
        reportType: schedule.reportType,
        recipients,
        duration: Date.now() - startTime
      };

    } catch (err) {
      error = err.message;
      console.error(`[ScheduledReport] Failed to execute report ${schedule._id}:`, err.message);

      // Update schedule with failure
      schedule.lastRun = new Date();
      schedule.lastRunStatus = 'failed';
      schedule.lastRunError = err.message;
      schedule.nextRun = schedule.calculateNextRun();
      await schedule.save();

      return {
        success: false,
        error: err.message,
        duration: Date.now() - startTime
      };
    }
  },

  /**
   * Generate a PDF buffer for a report
   *
   * @param {object} schedule - Schedule with populated companyId
   * @returns {Buffer} PDF buffer
   */
  async generateReportPDF(schedule) {
    const company = schedule.companyId;
    const companyId = company._id;

    switch (schedule.reportType) {
      case 'dqf':
        return this.generateDQFReport(companyId, company);
      case 'vehicle-maintenance':
        return this.generateVehicleMaintenanceReport(companyId, company);
      case 'violations':
        return this.generateViolationsReport(companyId, company, schedule.filters);
      case 'audit':
        return this.generateAuditReport(companyId, company);
      case 'csa':
        return this.generateCSAReport(companyId, company);
      default:
        throw new Error(`Unknown report type: ${schedule.reportType}`);
    }
  },

  /**
   * Helper to generate PDF to buffer instead of stream
   */
  async pdfToBuffer(generateFn) {
    return new Promise((resolve, reject) => {
      const doc = pdf.createDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      generateFn(doc);
      doc.end();
    });
  },

  /**
   * Generate DQF Report
   */
  async generateDQFReport(companyId, company) {
    const drivers = await Driver.find({ companyId, status: 'active' }).select('-ssn');

    return this.pdfToBuffer((doc) => {
      pdf.addHeader(doc, company, 'Driver Qualification Files Report');

      const compliant = drivers.filter(d => d.complianceStatus?.overall === 'compliant').length;
      pdf.addSummaryBox(doc, 'Summary', [
        { value: drivers.length, label: 'Total Drivers' },
        { value: compliant, label: 'Compliant' },
        { value: drivers.length - compliant, label: 'Needs Attention' }
      ]);

      pdf.addSectionTitle(doc, 'Driver Details');

      const headers = ['Driver Name', 'Employee ID', 'CDL Status', 'Medical Card', 'Overall Status'];
      const rows = drivers.map(d => [
        `${d.firstName} ${d.lastName}`,
        d.employeeId || '-',
        d.complianceStatus?.cdlStatus || '-',
        d.complianceStatus?.medicalStatus || '-',
        d.complianceStatus?.overall || '-'
      ]);

      pdf.addTable(doc, headers, rows, [120, 80, 100, 100, 100]);
      pdf.addFooter(doc);
    });
  },

  /**
   * Generate Vehicle Maintenance Report
   */
  async generateVehicleMaintenanceReport(companyId, company) {
    const vehicles = await Vehicle.find({ companyId });

    return this.pdfToBuffer((doc) => {
      pdf.addHeader(doc, company, 'Vehicle Maintenance Report');

      const compliant = vehicles.filter(v => v.complianceStatus?.overall === 'compliant').length;
      const inMaintenance = vehicles.filter(v => v.status === 'maintenance').length;

      pdf.addSummaryBox(doc, 'Summary', [
        { value: vehicles.length, label: 'Total Vehicles' },
        { value: compliant, label: 'Compliant' },
        { value: inMaintenance, label: 'In Maintenance' }
      ]);

      pdf.addSectionTitle(doc, 'Fleet Overview');

      const headers = ['Unit #', 'Type', 'VIN', 'Status', 'Next Inspection'];
      const rows = vehicles.map(v => [
        v.unitNumber,
        v.vehicleType || '-',
        v.vin ? `...${v.vin.slice(-6)}` : '-',
        v.status || '-',
        pdf.formatDate(v.annualInspection?.nextDueDate)
      ]);

      pdf.addTable(doc, headers, rows, [70, 80, 80, 80, 100]);
      pdf.addFooter(doc);
    });
  },

  /**
   * Generate Violations Report
   */
  async generateViolationsReport(companyId, company, filters = {}) {
    const query = { companyId };
    if (filters.startDate || filters.endDate) {
      query.violationDate = {};
      if (filters.startDate) query.violationDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.violationDate.$lte = new Date(filters.endDate);
    }

    const violations = await Violation.find(query)
      .populate('driverId', 'firstName lastName')
      .sort('-violationDate');

    return this.pdfToBuffer((doc) => {
      pdf.addHeader(doc, company, 'Violations Summary Report');

      const open = violations.filter(v => v.status === 'open').length;
      const disputed = violations.filter(v => v.status === 'dispute_in_progress').length;

      pdf.addSummaryBox(doc, 'Summary', [
        { value: violations.length, label: 'Total Violations' },
        { value: open, label: 'Open' },
        { value: disputed, label: 'In Dispute' }
      ]);

      // By BASIC category
      pdf.addSectionTitle(doc, 'Violations by BASIC Category');
      const byBasic = violations.reduce((acc, v) => {
        acc[v.basic] = (acc[v.basic] || 0) + 1;
        return acc;
      }, {});

      const basicHeaders = ['BASIC Category', 'Count'];
      const basicRows = Object.entries(byBasic).map(([basic, count]) => [basic, count]);
      if (basicRows.length > 0) {
        pdf.addTable(doc, basicHeaders, basicRows, [300, 100]);
      }

      doc.moveDown(1);

      pdf.addSectionTitle(doc, 'Violation Details');

      const headers = ['Date', 'Type', 'BASIC', 'Severity', 'Driver', 'Status'];
      const rows = violations.slice(0, 50).map(v => [
        pdf.formatDate(v.violationDate),
        v.violationType?.substring(0, 20) || '-',
        v.basic || '-',
        v.severityWeight || '-',
        v.driverId ? `${v.driverId.firstName} ${v.driverId.lastName}` : '-',
        v.status || '-'
      ]);

      pdf.addTable(doc, headers, rows, [70, 100, 70, 50, 100, 80]);
      pdf.addFooter(doc);
    });
  },

  /**
   * Generate Audit Report
   */
  async generateAuditReport(companyId, company) {
    const [drivers, vehicles, violations, drugTests, documents] = await Promise.all([
      Driver.find({ companyId, status: 'active' }),
      Vehicle.find({ companyId, status: { $in: ['active', 'maintenance'] } }),
      Violation.find({ companyId }).sort('-violationDate').limit(50),
      DrugAlcoholTest.find({ companyId }).sort('-testDate').limit(50),
      Document.find({ companyId, isDeleted: false })
    ]);

    return this.pdfToBuffer((doc) => {
      pdf.addHeader(doc, company, 'Comprehensive Audit Report');

      // Company info
      pdf.addSectionTitle(doc, 'Company Information');
      pdf.addKeyValuePairs(doc, [
        ['Company Name', company.name],
        ['DOT Number', company.dotNumber],
        ['MC Number', company.mcNumber || 'N/A']
      ]);

      doc.moveDown(1);

      // Driver Summary
      const driversCompliant = drivers.filter(d => d.complianceStatus?.overall === 'compliant').length;
      pdf.addSectionTitle(doc, 'Driver Qualification Summary');
      pdf.addSummaryBox(doc, 'Drivers', [
        { value: drivers.length, label: 'Active Drivers' },
        { value: driversCompliant, label: 'Compliant' },
        { value: drivers.length - driversCompliant, label: 'Needs Attention' }
      ]);

      // Vehicle Summary
      const vehiclesCompliant = vehicles.filter(v => v.complianceStatus?.overall === 'compliant').length;
      pdf.addSectionTitle(doc, 'Vehicle Fleet Summary');
      pdf.addSummaryBox(doc, 'Vehicles', [
        { value: vehicles.length, label: 'Total Vehicles' },
        { value: vehiclesCompliant, label: 'Compliant' },
        { value: vehicles.length - vehiclesCompliant, label: 'Needs Attention' }
      ]);

      // Violations Summary
      const openViolations = violations.filter(v => v.status === 'open').length;
      const disputed = violations.filter(v => v.status === 'dispute_in_progress').length;
      pdf.addSectionTitle(doc, 'Violations Summary');
      pdf.addSummaryBox(doc, 'Violations', [
        { value: violations.length, label: 'Total (Last 50)' },
        { value: openViolations, label: 'Open' },
        { value: disputed, label: 'In Dispute' }
      ]);

      // Document Summary
      const expiringSoon = documents.filter(d => d.status === 'due_soon').length;
      const expired = documents.filter(d => d.status === 'expired').length;
      pdf.addSectionTitle(doc, 'Documents Summary');
      pdf.addSummaryBox(doc, 'Documents', [
        { value: documents.length, label: 'Total Documents' },
        { value: expiringSoon, label: 'Expiring Soon' },
        { value: expired, label: 'Expired' }
      ]);

      // SMS BASIC Scores if available
      if (company.smsBasics) {
        doc.moveDown(1);
        pdf.addSectionTitle(doc, 'SMS BASIC Scores');

        const basicHeaders = ['BASIC Category', 'Percentile'];
        const basicRows = Object.entries(company.smsBasics)
          .filter(([key, value]) => typeof value === 'number')
          .map(([basic, score]) => [basic.replace(/([A-Z])/g, ' $1').trim(), `${score}%`]);

        if (basicRows.length > 0) {
          pdf.addTable(doc, basicHeaders, basicRows, [200, 100]);
        }
      }

      pdf.addFooter(doc);
    });
  },

  /**
   * Generate CSA/SMS BASICs Report
   */
  async generateCSAReport(companyId, company) {
    // Refresh company data to get latest SMS scores
    const freshCompany = await Company.findById(companyId);

    return this.pdfToBuffer((doc) => {
      pdf.addHeader(doc, freshCompany, 'CSA/SMS BASICs Report');

      // Company info
      pdf.addSectionTitle(doc, 'Carrier Information');
      pdf.addKeyValuePairs(doc, [
        ['Company Name', freshCompany.name],
        ['DOT Number', freshCompany.dotNumber],
        ['MC Number', freshCompany.mcNumber || 'N/A'],
        ['Operating Status', freshCompany.fmcsaData?.operatingStatus || 'Unknown'],
        ['Safety Rating', freshCompany.fmcsaData?.safetyRating || 'Not Rated']
      ]);

      doc.moveDown(1);

      // SMS BASIC Scores
      if (freshCompany.smsBasics) {
        pdf.addSectionTitle(doc, 'SMS BASIC Percentiles');

        const basicNames = {
          unsafeDriving: 'Unsafe Driving',
          hoursOfService: 'Hours of Service',
          vehicleMaintenance: 'Vehicle Maintenance',
          controlledSubstances: 'Controlled Substances',
          driverFitness: 'Driver Fitness',
          crashIndicator: 'Crash Indicator'
        };

        const thresholds = {
          unsafeDriving: 65,
          hoursOfService: 65,
          vehicleMaintenance: 80,
          controlledSubstances: 80,
          driverFitness: 80,
          crashIndicator: 65
        };

        const headers = ['BASIC Category', 'Percentile', 'Threshold', 'Status'];
        const rows = Object.entries(basicNames).map(([key, name]) => {
          const score = freshCompany.smsBasics[key];
          const threshold = thresholds[key];
          let status = 'OK';
          if (score !== null && score !== undefined) {
            if (score >= threshold) status = 'INTERVENTION';
            else if (score >= threshold - 15) status = 'WARNING';
          }
          return [
            name,
            score !== null && score !== undefined ? `${score}%` : 'N/A',
            `${threshold}%`,
            status
          ];
        });

        pdf.addTable(doc, headers, rows, [150, 80, 80, 100]);

        // Last updated
        if (freshCompany.smsBasics.lastUpdated) {
          doc.moveDown(0.5);
          doc.fontSize(9)
             .fillColor(pdf.COLORS?.lightText || '#71717A')
             .text(`Last updated: ${new Date(freshCompany.smsBasics.lastUpdated).toLocaleString()}`);
        }
      }

      // Inspection stats
      if (freshCompany.fmcsaData?.inspections) {
        doc.moveDown(1);
        pdf.addSectionTitle(doc, 'Inspection Statistics (24 Months)');

        const inspections = freshCompany.fmcsaData.inspections;
        pdf.addKeyValuePairs(doc, [
          ['Total Inspections', inspections.total || 0],
          ['Driver Inspections', inspections.driverInsp || 0],
          ['Vehicle Inspections', inspections.vehicleInsp || 0],
          ['Driver OOS Rate', `${inspections.driverOOSPercent || 0}%`],
          ['Vehicle OOS Rate', `${inspections.vehicleOOSPercent || 0}%`]
        ]);
      }

      // Crash stats
      if (freshCompany.fmcsaData?.crashes) {
        doc.moveDown(1);
        pdf.addSectionTitle(doc, 'Crash Statistics (24 Months)');

        const crashes = freshCompany.fmcsaData.crashes;
        pdf.addKeyValuePairs(doc, [
          ['Total Crashes', crashes.total || crashes.last24Months || 0],
          ['Fatal Crashes', crashes.fatal || 0],
          ['Injury Crashes', crashes.injury || 0],
          ['Tow-Away Crashes', crashes.towAway || 0]
        ]);
      }

      pdf.addFooter(doc);
    });
  },

  /**
   * Process all due scheduled reports
   * Called by cron job every hour
   *
   * @returns {object} Summary of processed reports
   */
  async processAllDueReports() {
    const dueReports = await ScheduledReport.findDueReports();

    console.log(`[ScheduledReport] Found ${dueReports.length} due report(s)`);

    const results = {
      total: dueReports.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (const schedule of dueReports) {
      try {
        const result = await this.executeReport(schedule);
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({ scheduleId: schedule._id, error: result.error });
        }
      } catch (err) {
        results.failed++;
        results.errors.push({ scheduleId: schedule._id, error: err.message });
        console.error(`[ScheduledReport] Failed to process schedule ${schedule._id}:`, err.message);
      }
    }

    if (results.total > 0) {
      console.log(`[ScheduledReport] Processed ${results.total} reports: ${results.success} success, ${results.failed} failed`);
    }

    return results;
  }
};

module.exports = scheduledReportService;
