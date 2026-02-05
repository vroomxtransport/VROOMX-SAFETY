require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Redis rate limiting for multi-server deployments
let RedisStore;
let redisClient;
if (process.env.REDIS_URL) {
  try {
    const { RedisStore: Store } = require('rate-limit-redis');
    const Redis = require('ioredis');
    RedisStore = Store;
    redisClient = new Redis(process.env.REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1
    });
    redisClient.on('error', (err) => {
      console.warn('Redis connection error, falling back to in-memory rate limiting:', err.message);
      redisClient = null;
    });
    console.log('Redis rate limiting enabled');
  } catch (err) {
    console.warn('Redis rate limiting not available, using in-memory:', err.message);
  }
}
const connectDB = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const maintenanceMode = require('./middleware/maintenance');
const alertService = require('./services/alertService');
const emailService = require('./services/emailService');
const logger = require('./utils/logger');

// Validate required environment variables at startup
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// In production, also validate service-specific env vars
if (process.env.NODE_ENV === 'production') {
  const productionEnvVars = [
    'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
    'STRIPE_SOLO_PRICE_ID', 'STRIPE_FLEET_PRICE_ID', 'STRIPE_PRO_PRICE_ID',
    'RESEND_API_KEY', 'FRONTEND_URL'
  ];
  const missingProdVars = productionEnvVars.filter(v => !process.env[v]);
  if (missingProdVars.length > 0) {
    console.error(`FATAL: Missing production environment variables: ${missingProdVars.join(', ')}`);
    process.exit(1);
  }

}

// Enforce strong JWT secret in production (minimum 32 characters)
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET must be at least 32 characters in production. Weak secrets can be brute-forced.');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET is too short. Use at least 32 characters for production.');
  }
}

// FMCSA credentials are optional in all environments - sync features disabled without them
const fmcsaVars = ['SAFERWEB_API_KEY', 'SOCRATA_APP_TOKEN'];
const missingFmcsa = fmcsaVars.filter(v => !process.env[v]);
if (missingFmcsa.length > 0) {
  console.warn(`WARNING: Missing FMCSA credentials (${missingFmcsa.join(', ')}). FMCSA sync will be disabled.`);
}

// Initialize express
const app = express();

// Trust first proxy (Render, Heroku, etc.) so express-rate-limit gets real client IPs
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Connect to database
connectDB();

// Security middleware - full Helmet configuration
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"]
    }
  } : false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS configuration - fail closed if FRONTEND_URL not set in production
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      console.error('WARNING: FRONTEND_URL not set in production. CORS will reject all origins.');
      return [];
    }
    return frontendUrl.split(',').map(url => url.trim()).filter(Boolean);
  }
  return ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'];
};

app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    // Allow requests with no origin (server-to-server, curl) only in non-production
    if (!origin) return callback(null, process.env.NODE_ENV !== 'production');
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['RateLimit-Policy', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After']
}));

// Global rate limiting - 100 requests per 30s per IP
// Uses Redis for multi-server deployments when REDIS_URL is configured
const globalLimiterConfig = {
  windowMs: 30 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
};
if (redisClient && RedisStore) {
  globalLimiterConfig.store = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:global:'
  });
}
const globalLimiter = rateLimit(globalLimiterConfig);
app.use('/api', globalLimiter);

// Stricter rate limit for auth endpoints - keyed on IP + email so
// blocking one email doesn't block login attempts for other accounts
const authLimiterConfig = {
  windowMs: 30 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const email = (req.body && req.body.email) ? req.body.email.toLowerCase().trim() : '';
    const ip = ipKeyGenerator(req, res);
    return `${ip}:${email}`;
  },
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
};
if (redisClient && RedisStore) {
  authLimiterConfig.store = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:auth:'
  });
}
const authLimiter = rateLimit(authLimiterConfig);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Body parsing — skip JSON parsing for Stripe webhook (needs raw body for signature verification)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/billing/webhook') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging - custom format that excludes Authorization headers
if (process.env.NODE_ENV === 'development') {
  morgan.token('user-id', (req) => req.user?.id || 'anonymous');
  app.use(morgan(':method :url :status :response-time ms - :user-id'));
}

// Static files - uploaded documents served through authenticated endpoint only
// SECURITY: Removed express.static for /uploads to prevent unauthorized access
// Files are now served through /api/documents/:id/download with auth checks

// Health check endpoint with database connectivity check
const mongoose = require('mongoose');
app.get('/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    if (dbState === 1) {
      await mongoose.connection.db.admin().ping();
    }
    const status = dbState === 1 ? 'healthy' : 'degraded';
    res.status(dbState === 1 ? 200 : 503).json({
      status,
      database: dbStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: Math.floor(process.uptime())
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  }
});

// Maintenance mode check (before API routes)
app.use(maintenanceMode);

// API routes
app.use('/api', routes);

// Handle 404
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║     VroomX Safety API Server                          ║
  ║     Running on port ${PORT}                              ║
  ║     Environment: ${process.env.NODE_ENV || 'development'}                      ║
  ╚═══════════════════════════════════════════════════════╝
  `);

  // Cron job overlap guards
  let isAlertGenRunning = false;
  let isEscalationRunning = false;
  let isTrialCheckRunning = false;
  let isReportProcessingRunning = false;
  let isSamsaraSyncRunning = false;
  let isFmcsaSyncRunning = false;

  // Schedule daily alert generation at 6:00 AM
  cron.schedule('0 6 * * *', async () => {
    if (isAlertGenRunning) { logger.cron('Daily alert generation already running, skipping'); return; }
    isAlertGenRunning = true;
    try {
      logger.cron('Running daily alert generation...');
      const result = await alertService.generateAlertsForAllCompanies();
      logger.cron('Daily alert generation complete', result);

      // Send daily alert digest emails
      try {
        await emailService.sendDailyAlertDigests();
        logger.cron('Daily alert digest emails sent');
      } catch (emailError) {
        logger.error('[Cron] Error sending alert digest emails', emailError);
      }
    } catch (error) {
      logger.error('[Cron] Error in daily alert generation', error);
    } finally {
      isAlertGenRunning = false;
    }
  });

  // Schedule alert escalation check every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    if (isEscalationRunning) { logger.cron('Alert escalation already running, skipping'); return; }
    isEscalationRunning = true;
    try {
      logger.cron('Running alert escalation check...');
      const escalated = await alertService.escalateAlerts();
      logger.cron(`Escalated ${escalated} alerts`);
    } catch (error) {
      logger.error('[Cron] Error in alert escalation', error);
    } finally {
      isEscalationRunning = false;
    }
  });

  // Schedule trial ending notifications at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    if (isTrialCheckRunning) { logger.cron('Trial check already running, skipping'); return; }
    isTrialCheckRunning = true;
    try {
      logger.cron('Checking for trials ending soon...');
      const User = require('./models/User');
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

      const users = await User.find({
        'subscription.status': 'trialing',
        'subscription.trialEndsAt': { $gte: twoDaysFromNow, $lte: threeDaysFromNow }
      });

      for (const user of users) {
        await emailService.sendTrialEnding(user);
      }
      logger.cron(`Sent ${users.length} trial ending notifications`);
    } catch (error) {
      logger.error('[Cron] Error checking trials', error);
    } finally {
      isTrialCheckRunning = false;
    }
  });

  // Schedule report processing every hour
  cron.schedule('0 * * * *', async () => {
    if (isReportProcessingRunning) { logger.cron('Report processing already running, skipping'); return; }
    isReportProcessingRunning = true;
    try {
      logger.cron('Processing scheduled reports...');
      const scheduledReportService = require('./services/scheduledReportService');
      const result = await scheduledReportService.processAllDueReports();
      if (result.total > 0) {
        logger.cron(`Scheduled reports: ${result.success} success, ${result.failed} failed`);
      }
    } catch (error) {
      logger.error('[Cron] Error processing scheduled reports', error);
    } finally {
      isReportProcessingRunning = false;
    }
  });

  // Sync Samsara integrations every hour (for companies with autoSync enabled)
  cron.schedule('30 * * * *', async () => {
    if (isSamsaraSyncRunning) { logger.cron('Samsara sync already running, skipping'); return; }
    isSamsaraSyncRunning = true;
    try {
      logger.cron('Running hourly Samsara sync...');
      const Integration = require('./models/Integration');
      const samsaraService = require('./services/samsaraService');

      const activeIntegrations = await Integration.find({
        provider: 'samsara',
        status: 'active',
        'syncConfig.autoSync': true
      });

      if (activeIntegrations.length === 0) {
        return;
      }

      let successCount = 0;
      for (const integration of activeIntegrations) {
        try {
          await samsaraService.syncAll(integration, integration.syncConfig);
          integration.lastSyncAt = new Date();
          integration.status = 'active';
          integration.error = null;
          await integration.save();
          successCount++;
        } catch (err) {
          logger.error(`[Cron] Samsara sync failed for company ${integration.companyId}`, { error: err.message });
          integration.error = err.message;
          await integration.save();
        }
      }

      logger.cron(`Samsara sync completed: ${successCount}/${activeIntegrations.length} integrations`);
    } catch (err) {
      logger.error('[Cron] Samsara sync job failed', { error: err.message });
    } finally {
      isSamsaraSyncRunning = false;
    }
  });

  // Sync FMCSA data every 6 hours (CSA scores, violations, inspection stats)
  cron.schedule('0 */6 * * *', async () => {
    if (isFmcsaSyncRunning) { logger.cron('FMCSA sync already running, skipping'); return; }
    // Skip if FMCSA credentials not configured
    if (!process.env.SAFERWEB_API_KEY || !process.env.SOCRATA_APP_TOKEN) {
      logger.cron('FMCSA sync skipped - credentials not configured');
      return;
    }
    isFmcsaSyncRunning = true;
    try {
      logger.cron('Running FMCSA data sync...');
      const fmcsaSyncOrchestrator = require('./services/fmcsaSyncOrchestrator');
      const result = await fmcsaSyncOrchestrator.syncAllCompanies();
      logger.cron(`FMCSA sync complete: ${result.succeeded}/${result.total} companies succeeded`);
      if (result.errors.length > 0) {
        logger.warn(`[Cron] FMCSA sync had ${result.errors.length} company failures`);
      }
    } catch (error) {
      logger.error('[Cron] FMCSA sync job failed', { error: error.message });
    } finally {
      isFmcsaSyncRunning = false;
    }
  });

  logger.info('[Cron] Scheduled: Daily alerts at 6 AM, Alert digest emails, Escalation check every 6 hours, Trial ending check at 9 AM, Scheduled reports every hour, Samsara sync every hour, FMCSA data sync every 6 hours');
});

// Graceful shutdown handler
const SHUTDOWN_TIMEOUT_MS = 30000;

function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    }).catch(() => {
      process.exit(0);
    });
  });

  // Force exit after timeout
  setTimeout(() => {
    console.error('Graceful shutdown timed out, forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions — log and exit so process manager can restart
process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught Exception:', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections — log and exit in production
process.on('unhandledRejection', (err) => {
  console.error('FATAL: Unhandled Rejection:', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

module.exports = app;
