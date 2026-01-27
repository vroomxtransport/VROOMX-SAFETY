require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const alertService = require('./services/alertService');
const emailService = require('./services/emailService');

// Validate required environment variables at startup
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Warn about weak JWT secret
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('WARNING: JWT_SECRET is too short. Use at least 32 characters for production.');
}

// Initialize express
const app = express();

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
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Global rate limiting - 100 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api', globalLimiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging - custom format that excludes Authorization headers
if (process.env.NODE_ENV === 'development') {
  morgan.token('user-id', (req) => req.user?.id || 'anonymous');
  app.use(morgan(':method :url :status :response-time ms - :user-id'));
}

// Static files - uploaded documents served through authenticated endpoint only
// SECURITY: Removed express.static for /uploads to prevent unauthorized access
// Files are now served through /api/documents/:id/download with auth checks

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

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // In production, you might want to exit and let the process manager restart
  // process.exit(1);
});

module.exports = app;
