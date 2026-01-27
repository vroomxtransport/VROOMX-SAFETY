# VroomX Safety - Project Documentation

## Overview

**VroomX Safety** is an AI-powered FMCSA compliance management platform designed for small and medium-sized trucking companies (1-50 trucks). The platform helps motor carriers maintain DOT compliance through automated tracking, alerts, and document management.

**Live URLs:**
- Frontend: https://vroomxsafety.com (Netlify)
- Backend: https://vroomx-safety-api.onrender.com (Render)

**Status:** MVP Production-Ready

---

## Tech Stack

### Frontend
- **Framework:** React 18 + React Router 6
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (custom navy/orange theme)
- **UI Libraries:** Recharts, React Icons, React DatePicker, React Hot Toast
- **State Management:** React Context API (AuthContext, ThemeContext)
- **HTTP Client:** Axios
- **PDF Generation:** jsPDF + jsPDF-AutoTable

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + bcryptjs
- **AI Integration:** Anthropic Claude API, OpenAI API
- **Payments:** Stripe (live mode with metered billing)
- **File Uploads:** Multer (10MB limit)
- **Scheduling:** node-cron

---

## Project Structure

```
TRUCKING COMPLIANCE HUB1/
├── backend/
│   ├── config/           # Database, FMCSA compliance config
│   ├── middleware/       # Auth, uploads, error handling, subscription limits
│   ├── models/           # 20 Mongoose models
│   ├── routes/           # 26 API route files
│   ├── services/         # 11 business logic services
│   ├── templates/        # Email/document templates
│   ├── uploads/          # File storage
│   └── server.js         # Express entry point (port 5001)
│
├── frontend/
│   ├── src/
│   │   ├── components/   # 21 reusable components
│   │   ├── pages/        # 32 page components
│   │   ├── context/      # AuthContext, ThemeContext
│   │   ├── utils/        # API client, helpers
│   │   ├── data/         # Static data, blog posts
│   │   └── App.jsx       # Main routing
│   └── vite.config.js    # Vite config with API proxy
│
├── MOCKUPS/              # UI design mockups
├── MARKETING/            # Marketing materials
└── *.md                  # Documentation files
```

---

## Core Features

### Compliance Modules
1. **Driver Qualification Files (DQF)** - 49 CFR 391
   - CDL tracking with expiration alerts
   - Medical card validity (2-year tracking)
   - MVR reviews and employment history
   - Clearinghouse queries

2. **Vehicle Management** - 49 CFR 396
   - Annual DOT inspection tracking
   - Maintenance records and DVIR logging
   - Registration expiration alerts

3. **Violation & CSA Management**
   - Roadside inspection tracking
   - DataQ challenge workflow
   - SMS BASIC categorization
   - CSA score estimation

4. **Drug & Alcohol Program** - 49 CFR 382
   - Random testing records (50% drug, 10% alcohol)
   - Clearinghouse reporting
   - Return-to-Duty tracking

5. **Document Management**
   - Multi-category storage
   - Expiration tracking (7/30/60-day alerts)
   - AI document classification

### AI Features
- **VroomX AI Assistant** - Natural language compliance Q&A (Claude AI)
- **Regulation Assistant** - FMCSA regulation lookup
- **Document Intelligence** - Auto-classification via OpenAI Vision
- **CSA Estimator** - Calculate potential CSA impact

### Business Features
- **Free CSA Checker** - Public carrier lookup tool
- **Multi-Company Support** - Manage multiple DOT numbers
- **Team Management** - Role-based access control
- **Ticket System** - Support tickets
- **Damage Claims Tracking**

---

## Pricing (Per-Driver Billing)

| Plan  | Price     | Drivers Included | Extra Driver |
|-------|-----------|------------------|--------------|
| Solo  | $19/mo    | 1                | N/A          |
| Fleet | $39/mo    | 3                | +$6/driver   |
| Pro   | $89/mo    | 10               | +$5/driver   |

---

## Database Models (20)

1. User, Company, Driver, Vehicle
2. Violation, DrugAlcoholTest, Document
3. Alert, Ticket, DamageClaim, Accident
4. ComplianceScore, CompanyInvitation, Lead
5. CSAScoreHistory, MaintenanceRecord, Task
6. ChecklistTemplate, ChecklistAssignment

---

## Key API Endpoints

| Route              | Purpose                          |
|--------------------|----------------------------------|
| /api/auth          | Authentication & user management |
| /api/drivers       | Driver CRUD + documents          |
| /api/vehicles      | Vehicle CRUD + maintenance       |
| /api/violations    | Violation tracking + DataQ       |
| /api/documents     | Document management              |
| /api/dashboard     | Compliance overview + alerts     |
| /api/billing       | Stripe subscription management   |
| /api/ai            | AI chat completions              |
| /api/csa           | CSA score estimation             |
| /api/reports       | PDF report generation            |

---

## Development Setup

### Backend
```bash
cd backend
npm install
npm run dev  # Starts on port 5001
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Starts on port 5173
```

### Required Environment Variables
- MONGODB_URI
- JWT_SECRET
- STRIPE_SECRET_KEY (+ metered pricing IDs)
- ANTHROPIC_API_KEY
- OPENAI_API_KEY
- FRONTEND_URL

---

## Market Context

- **Target:** 580,000+ active US motor carriers (99%+ have <10 trucks)
- **TAM:** $9.8B software market, growing to $16.4B by 2032
- **Differentiation:** AI-powered, flat per-driver pricing, modern tech stack

---

## Current Status (Jan 2025)

### Completed
- Full authentication system
- Driver/Vehicle/Violation management
- Document management with expiration alerts
- CSA score tracking and estimation
- Stripe billing integration (live mode)
- Landing page + public CSA Checker
- Dark/light mode theming
- All P0-P4 API tests passing

### In Progress
- Marketing and user acquisition
- Email notification system
- Mobile responsiveness improvements

### Future
- SMS alerts
- Full Clearinghouse integration
- Document OCR
- Mobile app

---

## Changelog

### 2025-01-26
- **Limits:** Restricted free trial to 1 driver, 1 vehicle, 1 company (was 3/3/1)
  - Files: `backend/middleware/subscriptionLimits.js`, `backend/models/User.js`
  - Users on trial must subscribe to add more resources
- **UI:** Changed "Start Free Trial" to "Subscribe" on Billing page plan buttons
  - File: `frontend/src/pages/Billing.jsx`
  - Affected: Solo, Fleet, and Pro plan cards
- **Fix:** React Error #31 in BillingTab.jsx - Objects were being rendered directly instead of accessing nested properties (`.owned`, `.current`)
  - File: `frontend/src/components/settings/BillingTab.jsx`
  - Lines 48, 60, 72: Changed `currentUsage?.companies` to `currentUsage?.companies?.owned`, etc.
- **Added:** PROJECT.md - Comprehensive project documentation
