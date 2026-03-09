const Driver = require('../models/Driver');
const DrugAlcoholTest = require('../models/DrugAlcoholTest');
const Vehicle = require('../models/Vehicle');
const Accident = require('../models/Accident');
const Company = require('../models/Company');

const AUDIT_FACTORS = {
  dqf: { weight: 25, name: 'Driver Qualification Files' },
  drugAlcohol: { weight: 20, name: 'Drug & Alcohol Program' },
  vehicleMaintenance: { weight: 20, name: 'Vehicle Maintenance' },
  accidentRegister: { weight: 15, name: 'Accident Register' },
  hosRecords: { weight: 10, name: 'HOS Records' },
  insuranceAuthority: { weight: 10, name: 'Insurance & Authority' }
};

const auditReadinessService = {
  async calculateScore(companyId) {
    const [dqfScore, daScore, vehicleScore, accidentScore, hosScore, authorityScore] = await Promise.all([
      this._scoreDQF(companyId),
      this._scoreDrugAlcohol(companyId),
      this._scoreVehicleMaintenance(companyId),
      this._scoreAccidentRegister(companyId),
      this._scoreHOS(companyId),
      this._scoreAuthority(companyId)
    ]);

    const factors = {
      dqf: dqfScore,
      drugAlcohol: daScore,
      vehicleMaintenance: vehicleScore,
      accidentRegister: accidentScore,
      hosRecords: hosScore,
      insuranceAuthority: authorityScore
    };

    let totalScore = 0;
    let totalWeight = 0;
    const factorResults = [];

    for (const [key, score] of Object.entries(factors)) {
      const weight = AUDIT_FACTORS[key].weight;
      totalScore += score.score * weight;
      totalWeight += weight;
      factorResults.push({
        key,
        name: AUDIT_FACTORS[key].name,
        score: score.score,
        weight,
        issues: score.issues,
        recommendations: score.recommendations
      });
    }

    return {
      overallScore: Math.round(totalScore / totalWeight),
      factors: factorResults,
      topRisks: factorResults
        .filter(f => f.score < 70)
        .sort((a, b) => a.score - b.score)
        .slice(0, 3),
      calculatedAt: new Date()
    };
  },

  async _scoreDQF(companyId) {
    const drivers = await Driver.find({ companyId, status: 'active', isDeleted: { $ne: true } });
    if (drivers.length === 0) return { score: 100, issues: [], recommendations: [] };

    let totalComplete = 0;
    const issues = [];
    for (const driver of drivers) {
      const hasCDL = driver.cdl?.number && driver.cdl?.expiryDate && new Date(driver.cdl.expiryDate) > new Date();
      const hasMedical = driver.medicalCard?.expiryDate && new Date(driver.medicalCard.expiryDate) > new Date();
      const hasApp = driver.documents?.employmentApplication?.complete;
      const hasRoadTest = driver.documents?.roadTest?.date || driver.documents?.roadTest?.waived;

      const checks = [hasCDL, hasMedical, hasApp, hasRoadTest];
      const complete = checks.filter(Boolean).length;
      totalComplete += (complete / checks.length) * 100;

      if (!hasCDL) issues.push(`${driver.firstName} ${driver.lastName}: CDL expired or missing`);
      if (!hasMedical) issues.push(`${driver.firstName} ${driver.lastName}: Medical card expired or missing`);
    }

    const score = Math.round(totalComplete / drivers.length);
    return {
      score,
      issues: issues.slice(0, 5),
      recommendations: score < 80 ? ['Update expired CDLs and medical cards', 'Complete employment applications'] : []
    };
  },

  async _scoreDrugAlcohol(companyId) {
    const activeDrivers = await Driver.countDocuments({ companyId, status: 'active', isDeleted: { $ne: true } });
    if (activeDrivers === 0) return { score: 100, issues: [], recommendations: [] };

    const currentYear = new Date().getFullYear();
    const testCount = await DrugAlcoholTest.countDocuments({
      companyId,
      testDate: { $gte: new Date(currentYear, 0, 1) },
      isDeleted: { $ne: true }
    });

    const requiredTests = Math.ceil(activeDrivers * 0.6); // 50% drug + 10% alcohol
    const rate = Math.min(1, testCount / Math.max(1, requiredTests));
    const score = Math.round(rate * 100);
    const issues = [];
    if (testCount === 0) issues.push('No drug/alcohol tests recorded this year');
    if (rate < 1) issues.push(`Only ${testCount} of ${requiredTests} required tests completed`);
    return {
      score,
      issues,
      recommendations: score < 80 ? ['Schedule random drug/alcohol tests', 'Ensure pre-employment testing is documented'] : []
    };
  },

  async _scoreVehicleMaintenance(companyId) {
    const vehicles = await Vehicle.find({ companyId, status: 'active', isDeleted: { $ne: true } });
    if (vehicles.length === 0) return { score: 100, issues: [], recommendations: [] };

    const now = new Date();
    let current = 0;
    const issues = [];
    for (const v of vehicles) {
      if (v.annualInspection?.nextDueDate && new Date(v.annualInspection.nextDueDate) > now) {
        current++;
      } else {
        issues.push(`${v.unitNumber || v.vin}: Annual inspection overdue`);
      }
    }
    const score = Math.round((current / vehicles.length) * 100);
    return {
      score,
      issues: issues.slice(0, 5),
      recommendations: score < 80 ? ['Schedule overdue annual inspections', 'Review DVIR completion rates'] : []
    };
  },

  async _scoreAccidentRegister(companyId) {
    const accidents = await Accident.find({ companyId, isDeleted: { $ne: true } }).sort('-date').limit(20);
    if (accidents.length === 0) return { score: 100, issues: [], recommendations: ['Maintain accident register even with zero accidents'] };

    const issues = [];
    let documented = 0;
    for (const acc of accidents) {
      if (acc.documents?.length > 0 || acc.investigationNotes) {
        documented++;
      } else {
        issues.push(`Accident on ${new Date(acc.date).toLocaleDateString()}: Missing documentation`);
      }
    }
    const score = accidents.length > 0 ? Math.round((documented / accidents.length) * 100) : 100;
    return {
      score,
      issues: issues.slice(0, 3),
      recommendations: score < 80 ? ['Document all accidents with photos and reports', 'Complete investigation notes for each accident'] : []
    };
  },

  async _scoreHOS(companyId) {
    // HOS compliance is tracked via ELD providers — placeholder score
    return { score: 100, issues: [], recommendations: ['Ensure ELD integration is active for HOS monitoring'] };
  },

  async _scoreAuthority(companyId) {
    const company = await Company.findById(companyId);
    if (!company) return { score: 0, issues: ['Company not found'], recommendations: [] };

    const issues = [];
    let checks = 0;
    let passed = 0;

    // Check DOT number
    checks++;
    if (company.dotNumber) { passed++; } else { issues.push('Missing DOT number'); }

    // Check MC number (if applicable)
    checks++;
    if (company.mcNumber) { passed++; } else { issues.push('MC number not on file'); }

    const score = checks > 0 ? Math.round((passed / checks) * 100) : 100;
    return {
      score,
      issues,
      recommendations: score < 80 ? ['Verify operating authority is current', 'Ensure insurance certificates are on file'] : []
    };
  }
};

module.exports = auditReadinessService;
