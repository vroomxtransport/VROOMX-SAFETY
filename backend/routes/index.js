const express = require('express');
const router = express.Router();
const { demoGuard } = require('../middleware/demoGuard');

const authRoutes = require('./auth');
const driverRoutes = require('./drivers');
const vehicleRoutes = require('./vehicles');
const violationRoutes = require('./violations');
const ticketRoutes = require('./tickets');
const drugAlcoholRoutes = require('./drugAlcohol');
const documentRoutes = require('./documents');
const dashboardRoutes = require('./dashboard');
const accidentRoutes = require('./accidents');
const reportRoutes = require('./reports');
const seedRoutes = require('./seed');
const aiRoutes = require('./ai');
const damageClaimRoutes = require('./damageClaims');
const companyRoutes = require('./companies');
const billingRoutes = require('./billing');
const invitationRoutes = require('./invitations');
const inspectionRoutes = require('./inspections');
const csaRoutes = require('./csa');
const templateRoutes = require('./templates');
const csaCheckerRoutes = require('./csaChecker');
const fmcsaLookupRoutes = require('./fmcsaLookup');
const adminRoutes = require('./admin');
const taskRoutes = require('./tasks');
const checklistRoutes = require('./checklists');
const maintenanceRoutes = require('./maintenance');
const auditRoutes = require('./audit');
const announcementRoutes = require('./announcements');
const featureRoutes = require('./features');
const scheduledReportRoutes = require('./scheduledReports');

// Apply demo guard globally - blocks write operations for demo users
router.use(demoGuard);

// Mount routes
router.use('/auth', authRoutes);
router.use('/drivers', driverRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/violations', violationRoutes);
router.use('/tickets', ticketRoutes);
router.use('/drug-alcohol', drugAlcoholRoutes);
router.use('/documents', documentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/accidents', accidentRoutes);
router.use('/reports', reportRoutes);
router.use('/seed', seedRoutes);
router.use('/ai', aiRoutes);
router.use('/damage-claims', damageClaimRoutes);
router.use('/companies', companyRoutes);
router.use('/billing', billingRoutes);
router.use('/invitations', invitationRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/csa', csaRoutes);
router.use('/templates', templateRoutes);
router.use('/csa-checker', csaCheckerRoutes);
router.use('/fmcsa', fmcsaLookupRoutes);
router.use('/admin', adminRoutes);
router.use('/tasks', taskRoutes);
router.use('/checklists', checklistRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/audit', auditRoutes);
router.use('/announcements', announcementRoutes);
router.use('/features', featureRoutes);
router.use('/scheduled-reports', scheduledReportRoutes);

module.exports = router;
