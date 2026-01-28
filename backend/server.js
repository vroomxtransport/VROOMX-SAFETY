require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const maintenanceMode = require('./middleware/maintenance');
const alertService = require('./services/alertService');
const emailService = require('./services/emailService');

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

// Warn about weak JWT secret
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('WARNING: JWT_SECRET is too short. Use at least 32 characters for production.');
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
  return ['http://localhost:3000', 'http://localhost:5173'];
};

app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    // Allow requests with no origin (server-to-server, curl)
    if (!origin) return callback(null, true);
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
const globalLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api', globalLimiter);

// Stricter rate limit for auth endpoints - keyed on IP + email so
// blocking one email doesn't block login attempts for other accounts
const authLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body && req.body.email) ? req.body.email.toLowerCase().trim() : '';
    return `${req.ip}:${email}`;
  },
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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

      // Send daily alert digest emails
      try {
        await emailService.sendDailyAlertDigests();
        console.log('[Cron] Daily alert digest emails sent');
      } catch (emailError) {
        console.error('[Cron] Error sending alert digest emails:', emailError);
      }
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

  // Schedule trial ending notifications at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Checking for trials ending soon...');
    try {
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
      console.log(`[Cron] Sent ${users.length} trial ending notifications`);
    } catch (error) {
      console.error('[Cron] Error checking trials:', error);
    }
  });

  console.log('[Cron] Scheduled: Daily alerts at 6 AM, Alert digest emails, Escalation check every 6 hours, Trial ending check at 9 AM');
});

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
