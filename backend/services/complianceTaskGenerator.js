const Task = require('../models/Task');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Company = require('../models/Company');

const EXPIRY_THRESHOLD_DAYS = 30;

const generateComplianceTasks = async () => {
  console.log('[ComplianceTaskGenerator] Starting compliance task generation...');
  const companies = await Company.find({ status: { $ne: 'suspended' } }).select('_id');
  let totalCreated = 0;

  for (const company of companies) {
    try {
      const created = await generateForCompany(company._id);
      totalCreated += created;
    } catch (err) {
      console.error(`[ComplianceTaskGenerator] Error for company ${company._id}:`, err.message);
    }
  }

  console.log(`[ComplianceTaskGenerator] Complete. Created ${totalCreated} tasks across ${companies.length} companies.`);
  return totalCreated;
};

const generateForCompany = async (companyId) => {
  let created = 0;
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + EXPIRY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  // --- Driver-related tasks ---
  const drivers = await Driver.find({
    companyId,
    isArchived: { $ne: true },
    status: { $in: ['active', 'suspended'] }
  }).select('firstName lastName cdl medicalCard clearinghouse mvrExpiryDate compliantUntil');

  for (const driver of drivers) {
    const driverName = `${driver.firstName} ${driver.lastName}`;

    // CDL expiring
    if (driver.cdl?.expiryDate && new Date(driver.cdl.expiryDate) <= thresholdDate) {
      const days = Math.ceil((new Date(driver.cdl.expiryDate) - now) / (1000 * 60 * 60 * 24));
      created += await createIfNotExists(companyId, {
        title: `CDL expiring for ${driverName}`,
        description: `CDL expires ${days <= 0 ? 'EXPIRED' : `in ${days} days`} on ${new Date(driver.cdl.expiryDate).toLocaleDateString()}. Ensure renewal is in progress.`,
        dueDate: driver.cdl.expiryDate,
        priority: days <= 7 ? 'high' : days <= 14 ? 'high' : 'medium',
        category: 'expiring_doc',
        linkedTo: { type: 'driver', refId: driver._id, refName: driverName }
      });
    }

    // Medical card expiring
    if (driver.medicalCard?.expiryDate && new Date(driver.medicalCard.expiryDate) <= thresholdDate) {
      const days = Math.ceil((new Date(driver.medicalCard.expiryDate) - now) / (1000 * 60 * 60 * 24));
      created += await createIfNotExists(companyId, {
        title: `Medical card expiring for ${driverName}`,
        description: `Medical certificate expires ${days <= 0 ? 'EXPIRED' : `in ${days} days`}. Schedule physical exam.`,
        dueDate: driver.medicalCard.expiryDate,
        priority: days <= 7 ? 'high' : 'medium',
        category: 'expiring_doc',
        linkedTo: { type: 'driver', refId: driver._id, refName: driverName }
      });
    }

    // Clearinghouse expiring
    if (driver.clearinghouse?.expiryDate && new Date(driver.clearinghouse.expiryDate) <= thresholdDate) {
      created += await createIfNotExists(companyId, {
        title: `Clearinghouse query due for ${driverName}`,
        description: `Annual Clearinghouse query is due. Ensure query is submitted.`,
        dueDate: driver.clearinghouse.expiryDate,
        priority: 'medium',
        category: 'expiring_doc',
        linkedTo: { type: 'driver', refId: driver._id, refName: driverName }
      });
    }

    // MVR expiring
    if (driver.mvrExpiryDate && new Date(driver.mvrExpiryDate) <= thresholdDate) {
      created += await createIfNotExists(companyId, {
        title: `MVR review due for ${driverName}`,
        description: `Annual MVR review is due. Pull and review motor vehicle record.`,
        dueDate: driver.mvrExpiryDate,
        priority: 'medium',
        category: 'expiring_doc',
        linkedTo: { type: 'driver', refId: driver._id, refName: driverName }
      });
    }
  }

  // --- Vehicle-related tasks ---
  const vehicles = await Vehicle.find({
    companyId,
    status: { $in: ['active', 'maintenance'] }
  }).select('unitNumber vehicleType annualInspection registration insurance cabCardExpiry annualExpiry pmSchedule compliantUntil');

  for (const vehicle of vehicles) {
    const vName = `${vehicle.unitNumber} (${vehicle.vehicleType})`;

    // Annual inspection due
    if (vehicle.annualInspection?.nextDueDate && new Date(vehicle.annualInspection.nextDueDate) <= thresholdDate) {
      const days = Math.ceil((new Date(vehicle.annualInspection.nextDueDate) - now) / (1000 * 60 * 60 * 24));
      created += await createIfNotExists(companyId, {
        title: `Annual inspection due for ${vName}`,
        description: `Annual DOT inspection ${days <= 0 ? 'is OVERDUE' : `due in ${days} days`}. Schedule with qualified inspector.`,
        dueDate: vehicle.annualInspection.nextDueDate,
        priority: days <= 7 ? 'high' : 'medium',
        category: 'maintenance',
        linkedTo: { type: 'vehicle', refId: vehicle._id, refName: vName }
      });
    }

    // Registration expiring
    if (vehicle.registration?.expiryDate && new Date(vehicle.registration.expiryDate) <= thresholdDate) {
      created += await createIfNotExists(companyId, {
        title: `Registration expiring for ${vName}`,
        description: `Vehicle registration is expiring. Renew before expiry.`,
        dueDate: vehicle.registration.expiryDate,
        priority: 'medium',
        category: 'expiring_doc',
        linkedTo: { type: 'vehicle', refId: vehicle._id, refName: vName }
      });
    }

    // Insurance expiring
    if (vehicle.insurance?.expiryDate && new Date(vehicle.insurance.expiryDate) <= thresholdDate) {
      created += await createIfNotExists(companyId, {
        title: `Insurance expiring for ${vName}`,
        description: `Vehicle insurance policy is expiring. Contact provider for renewal.`,
        dueDate: vehicle.insurance.expiryDate,
        priority: 'high',
        category: 'expiring_doc',
        linkedTo: { type: 'vehicle', refId: vehicle._id, refName: vName }
      });
    }

    // PM schedule overdue
    if (vehicle.pmSchedule?.nextPmDueDate && new Date(vehicle.pmSchedule.nextPmDueDate) <= thresholdDate) {
      created += await createIfNotExists(companyId, {
        title: `Preventive maintenance due for ${vName}`,
        description: `Scheduled PM service is due. Schedule maintenance appointment.`,
        dueDate: vehicle.pmSchedule.nextPmDueDate,
        priority: 'medium',
        category: 'maintenance',
        linkedTo: { type: 'vehicle', refId: vehicle._id, refName: vName }
      });
    }
  }

  return created;
};

const createIfNotExists = async (companyId, taskData) => {
  // Check for existing open task with same title and linked entity
  const existing = await Task.findOne({
    companyId,
    title: taskData.title,
    'linkedTo.refId': taskData.linkedTo?.refId,
    status: { $nin: ['completed'] },
    source: 'auto_compliance'
  });

  if (existing) return 0;

  await Task.create({
    companyId,
    ...taskData,
    source: 'auto_compliance',
    createdBy: null // system-generated
  });

  return 1;
};

module.exports = { generateComplianceTasks, generateForCompany };
