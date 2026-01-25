require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');
const connectDB = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const alertService = require('./services/alertService');

// Initialize express
const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files (for uploaded documents)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api', routes);

// Handle 404
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║     VroomX Safety API Server                          ║
  ║     Running on port ${PORT}                              ║
  ║     Environment: ${process.env.NODE_ENV || 'development'}                      ║
  ╚═══════════════════════════════════════════════════════╝
  `);

  // Schedule daily alert generation at 6:00 AM
  cron.schedule('0 6 * * *', async () => {
    console.log('[Cron] Running daily alert generation...');
    try {
      const result = await alertService.generateAlertsForAllCompanies();
      console.log('[Cron] Daily alert generation complete:', result);
    } catch (error) {
      console.error('[Cron] Error in daily alert generation:', error);
    }
  });

  // Schedule alert escalation check every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Cron] Running alert escalation check...');
    try {
      const escalated = await alertService.escalateAlerts();
      console.log(`[Cron] Escalated ${escalated} alerts`);
    } catch (error) {
      console.error('[Cron] Error in alert escalation:', error);
    }
  });

  console.log('[Cron] Scheduled: Daily alerts at 6 AM, Escalation check every 6 hours');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // In production, you might want to exit and let the process manager restart
  // process.exit(1);
});

module.exports = app;
