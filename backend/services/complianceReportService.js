const Company = require('../models/Company');
const Violation = require('../models/Violation');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Document = require('../models/Document');
const DrugAlcoholTest = require('../models/DrugAlcoholTest');
const FMCSAInspection = require('../models/FMCSAInspection');
const ComplianceReport = require('../models/ComplianceReport');
const ComplianceScore = require('../models/ComplianceScore');
const aiService = require('./aiService');

const complianceReportService = {
  /**
   * Generate a comprehensive AI compliance analysis report
   */
  async generateReport(companyId, userId) {
    // 1. Gather all compliance data in parallel
    const [
      company,
      violations,
      drivers,
      vehicles,
      documents,
      drugTests,
      inspections,
      complianceScore
    ] = await Promise.all([
      Company.findById(companyId).select('name dotNumber smsBasics fmcsaData complianceScore fleetSize').lean(),
      Violation.find({ companyId }).sort({ violationDate: -1 }).lean(),
      Driver.find({ companyId, status: 'active' }).lean(),
      Vehicle.find({ companyId, status: { $in: ['active', 'maintenance'] } }).lean(),
      Document.find({ companyId }).lean(),
      DrugAlcoholTest.find({ companyId }).sort({ testDate: -1 }).lean(),
      FMCSAInspection.find({ companyId }).sort({ inspectionDate: -1 }).limit(20).lean(),
      ComplianceScore.findOne({ companyId }).sort({ calculatedAt: -1 }).lean()
    ]);

    if (!company) throw new Error('Company not found');

    // 2. Build data snapshot for Claude
    const snapshot = this._buildSnapshot(company, violations, drivers, vehicles, documents, drugTests, inspections, complianceScore);

    // 3. Send to Claude for analysis
    const { report, usage } = await aiService.generateComplianceReport(snapshot);

    // 4. Store report in DB
    const savedReport = await ComplianceReport.create({
      companyId,
      generatedBy: userId,
      overallRisk: report.overallRisk,
      overallScore: report.overallScore,
      executiveSummary: report.executiveSummary,
      categoryScores: report.categoryScores,
      findings: report.findings || [],
      actionItems: report.actionItems || [],
      dataSnapshot: snapshot,
      aiTokensUsed: (usage?.input_tokens || 0) + (usage?.output_tokens || 0)
    });

    return savedReport;
  },

  /**
   * Get the most recent report for a company
   */
  async getLatest(companyId) {
    return ComplianceReport.findOne({ companyId }).sort({ generatedAt: -1 }).lean();
  },

  /**
   * Get report history for a company
   */
  async getHistory(companyId, limit = 10) {
    return ComplianceReport.find({ companyId })
      .sort({ generatedAt: -1 })
      .limit(limit)
      .select('generatedAt overallRisk overallScore executiveSummary')
      .lean();
  },

  /**
   * Build a clean data snapshot for Claude analysis
   */
  _buildSnapshot(company, violations, drivers, vehicles, documents, drugTests, inspections, complianceScore) {
    const now = new Date();

    // BASIC scores
    const basics = company.smsBasics || {};
    const fmcsa = company.fmcsaData || {};
    const inspData = fmcsa.inspections || {};

    // Violation summary by BASIC
    const violationsByBasic = {};
    const recentViolations = [];
    for (const v of violations) {
      const basic = v.basic || 'unknown';
      if (!violationsByBasic[basic]) violationsByBasic[basic] = { count: 0, oosCount: 0, totalSeverity: 0 };
      violationsByBasic[basic].count++;
      if (v.outOfService) violationsByBasic[basic].oosCount++;
      violationsByBasic[basic].totalSeverity += v.severityWeight || 0;

      if (recentViolations.length < 10) {
        recentViolations.push({
          date: v.violationDate,
          code: v.violationCode,
          description: v.description?.substring(0, 100),
          basic: v.basic,
          severity: v.severityWeight,
          oos: v.outOfService
        });
      }
    }

    // Driver summary
    const driverSummary = {
      total: drivers.length,
      expiredCDL: 0,
      expiredMedical: 0,
      cdlExpiringSoon: 0,
      medicalExpiringSoon: 0,
      missingDQFItems: 0,
      dqfCompleteness: []
    };

    for (const d of drivers) {
      const cdlExp = d.cdl?.expiryDate ? new Date(d.cdl.expiryDate) : null;
      const medExp = d.medicalCard?.expiryDate ? new Date(d.medicalCard.expiryDate) : null;
      if (cdlExp && cdlExp < now) driverSummary.expiredCDL++;
      else if (cdlExp && cdlExp < new Date(now.getTime() + 30 * 86400000)) driverSummary.cdlExpiringSoon++;
      if (medExp && medExp < now) driverSummary.expiredMedical++;
      else if (medExp && medExp < new Date(now.getTime() + 30 * 86400000)) driverSummary.medicalExpiringSoon++;

      // DQF completeness
      let complete = 0;
      const required = 7;
      if (d.cdl?.number) complete++;
      if (d.medicalCard?.expiryDate) complete++;
      if (d.dqfDocuments?.employmentApplication) complete++;
      if (d.dqfDocuments?.roadTestCertificate) complete++;
      if (d.dqfDocuments?.mvrReview) complete++;
      if (d.dqfDocuments?.clearinghouseQuery) complete++;
      if (d.dqfDocuments?.previousEmployerVerification) complete++;
      driverSummary.dqfCompleteness.push({
        name: `${d.firstName} ${d.lastName}`,
        completeness: Math.round((complete / required) * 100)
      });
    }

    // Vehicle summary
    const vehicleSummary = {
      total: vehicles.length,
      currentInspection: 0,
      overdueInspection: 0,
      dueSoon: 0
    };

    for (const v of vehicles) {
      const nextDue = v.annualInspection?.nextDueDate ? new Date(v.annualInspection.nextDueDate) : null;
      if (!nextDue) vehicleSummary.overdueInspection++;
      else if (nextDue < now) vehicleSummary.overdueInspection++;
      else if (nextDue < new Date(now.getTime() + 30 * 86400000)) vehicleSummary.dueSoon++;
      else vehicleSummary.currentInspection++;
    }

    // Document summary
    const docSummary = { total: documents.length, valid: 0, expired: 0, dueSoon: 0, missing: 0 };
    for (const d of documents) {
      if (d.status === 'valid') docSummary.valid++;
      else if (d.status === 'expired') docSummary.expired++;
      else if (d.status === 'due_soon') docSummary.dueSoon++;
      else if (d.status === 'missing') docSummary.missing++;
    }

    // Drug & Alcohol summary
    const currentYear = now.getFullYear();
    const thisYearTests = drugTests.filter(t => new Date(t.testDate).getFullYear() === currentYear);
    const drugTestSummary = {
      totalThisYear: thisYearTests.length,
      randomDrug: thisYearTests.filter(t => t.testType === 'random' && t.substance === 'drug').length,
      randomAlcohol: thisYearTests.filter(t => t.testType === 'random' && t.substance === 'alcohol').length,
      positiveResults: thisYearTests.filter(t => t.result === 'positive').length,
      preEmployment: thisYearTests.filter(t => t.testType === 'pre_employment').length,
      driversInPool: drivers.length,
      requiredDrugRate: '50%',
      requiredAlcoholRate: '10%'
    };

    // Recent inspections summary
    const inspectionSummary = inspections.slice(0, 10).map(i => ({
      date: i.inspectionDate,
      state: i.state,
      level: i.inspectionLevel,
      violations: i.totalViolations,
      vehicleOOS: i.vehicleOOS,
      driverOOS: i.driverOOS,
      location: i.location
    }));

    return {
      carrier: {
        name: company.name,
        dotNumber: company.dotNumber,
        powerUnits: company.fleetSize?.powerUnits || null,
        drivers: drivers.length
      },
      csaBasics: {
        unsafeDriving: { percentile: basics.unsafeDriving, measure: basics.unsafeDrivingMeasure, threshold: 65 },
        hoursOfService: { percentile: basics.hoursOfService, measure: basics.hoursOfServiceMeasure, threshold: 65 },
        vehicleMaintenance: { percentile: basics.vehicleMaintenance, measure: basics.vehicleMaintenanceMeasure, threshold: 80 },
        controlledSubstances: { percentile: basics.controlledSubstances, measure: basics.controlledSubstancesMeasure, threshold: 80 },
        driverFitness: { percentile: basics.driverFitness, measure: basics.driverFitnessMeasure, threshold: 80 },
        crashIndicator: { percentile: basics.crashIndicator, measure: basics.crashIndicatorMeasure, threshold: 65 }
      },
      oosRates: {
        vehicle: { rate: inspData.vehicleOOSPercent, nationalAvg: inspData.vehicleNationalAvg },
        driver: { rate: inspData.driverOOSPercent, nationalAvg: inspData.driverNationalAvg }
      },
      totalInspections: inspData.totalInspections || 0,
      crashes: inspData.crashes || { fatal: 0, injury: 0, tow: 0, total: 0 },
      complianceScore: complianceScore ? {
        overall: complianceScore.overallScore,
        documents: complianceScore.components?.documentStatus?.score,
        violations: complianceScore.components?.violations?.score,
        drugAlcohol: complianceScore.components?.drugAlcohol?.score,
        dqf: complianceScore.components?.dqfCompleteness?.score,
        vehicle: complianceScore.components?.vehicleInspection?.score
      } : null,
      violationsByBasic,
      totalViolations: violations.length,
      recentViolations,
      driverSummary,
      vehicleSummary,
      documentSummary: docSummary,
      drugAlcoholSummary: drugTestSummary,
      recentInspections: inspectionSummary
    };
  }
};

module.exports = complianceReportService;
