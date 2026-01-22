# VroomX Safety - FMCSA Compliance Platform

A comprehensive, AI-powered FMCSA compliance management platform for small and medium-sized trucking companies. Built with React 18, Node.js/Express, and MongoDB.

**Live Demo:** [vroomx-safety.netlify.app](https://vroomx-safety.netlify.app)

---

## Features

### Core Compliance Modules

| Module | Description | FMCSA Regulation |
|--------|-------------|------------------|
| **Dashboard** | Real-time compliance overview, SMS BASICs monitoring, audit readiness score | - |
| **Driver Qualification (DQF)** | CDL, medical cards, MVRs, employment history, road tests | 49 CFR 391 |
| **Vehicle Files** | Maintenance logs, annual inspections, DVIRs | 49 CFR 396 |
| **Violation Tracker** | Roadside inspections, DataQ challenges, severity weighting | SMS |
| **Drug & Alcohol** | Random testing, Clearinghouse compliance, return-to-duty | 49 CFR 382 |
| **Compliance Dashboard** | VroomX compliance score (0-100), category breakdowns | - |
| **Document Library** | Centralized storage with expiration tracking | - |
| **Reports & Audit** | PDF exports for DOT audits | - |

### AI-Powered Features

- **VroomX AI Assistant** - Natural language compliance Q&A
- **Document Intelligence** - Auto-classification via OpenAI Vision API
- **Regulation Assistant** - AI-powered FMCSA regulation lookup
- **Smart Alerts** - Proactive compliance notifications

### Additional Features

- **CSA Estimator** - Calculate potential CSA scores before violations hit
- **Ticket Tracker** - Support ticket management
- **Damage Claims** - Cargo/vehicle damage tracking
- **Template Generator** - Generate compliance document templates
- **Multi-Company Support** - Manage multiple DOT numbers
- **Team Management** - Role-based access with invitations

---

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router 6** - Routing
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **jsPDF** - Client-side PDF generation
- **React Hot Toast** - Notifications
- **date-fns** - Date handling

### Backend
- **Node.js 18+** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **Puppeteer** - Server-side PDF generation
- **Cheerio** - Web scraping (FMCSA SAFER)
- **OpenAI SDK** - AI features
- **Anthropic SDK** - Claude AI integration
- **Stripe** - Payment processing
- **node-cron** - Scheduled tasks

---

## Project Structure

```
VroomX-Safety/
├── backend/
│   ├── config/
│   │   ├── database.js              # MongoDB connection
│   │   ├── fmcsaCompliance.js       # FMCSA regulations & thresholds
│   │   └── violationCodes.js        # Violation code mapping
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   ├── upload.js                # File upload handling
│   │   ├── errorHandler.js          # Global error handler
│   │   └── subscriptionLimits.js    # Subscription tier enforcement
│   ├── models/                      # MongoDB schemas (14 models)
│   │   ├── User.js                  # Users with roles/permissions
│   │   ├── Company.js               # Companies with DOT/MC numbers
│   │   ├── Driver.js                # Driver qualification files
│   │   ├── Vehicle.js               # Vehicle maintenance records
│   │   ├── Violation.js             # Violations with DataQ workflow
│   │   ├── DrugAlcoholTest.js       # D&A testing records
│   │   ├── Document.js              # Document library
│   │   ├── Accident.js              # Accident register
│   │   ├── Alert.js                 # System alerts
│   │   ├── Ticket.js                # Support tickets
│   │   ├── DamageClaim.js           # Damage claims
│   │   ├── ComplianceScore.js       # VroomX scoring
│   │   ├── CompanyInvitation.js     # Team invitations
│   │   └── Lead.js                  # Sales leads
│   ├── routes/                      # API routes (24 files)
│   │   ├── auth.js                  # Authentication
│   │   ├── drivers.js               # Driver CRUD & DQF
│   │   ├── vehicles.js              # Vehicle management
│   │   ├── violations.js            # Violations & DataQ
│   │   ├── drugAlcohol.js           # D&A testing
│   │   ├── documents.js             # Document library
│   │   ├── dashboard.js             # Dashboard metrics
│   │   ├── reports.js               # PDF generation
│   │   ├── ai.js                    # AI endpoints
│   │   ├── csa.js                   # CSA calculations
│   │   ├── csaChecker.js            # CSA checker tool
│   │   ├── fmcsaLookup.js           # FMCSA data lookup
│   │   ├── companies.js             # Company management
│   │   ├── billing.js               # Stripe integration
│   │   ├── invitations.js           # Team invitations
│   │   ├── tickets.js               # Support tickets
│   │   ├── damageClaims.js          # Damage claims
│   │   ├── alerts.js                # Alert management
│   │   ├── templates.js             # Document templates
│   │   └── inspections.js           # Inspection uploads
│   ├── services/                    # Business logic (9 services)
│   │   ├── fmcsaService.js          # FMCSA SAFER integration
│   │   ├── csaCalculatorService.js  # CSA score calculation
│   │   ├── complianceScoreService.js # VroomX scoring
│   │   ├── alertService.js          # Alert generation
│   │   ├── aiService.js             # AI compliance assistant
│   │   ├── openaiVisionService.js   # Document classification
│   │   ├── stripeService.js         # Billing integration
│   │   ├── documentIntelligenceService.js # Doc analysis
│   │   └── templateGeneratorService.js # Template generation
│   ├── uploads/                     # File storage
│   ├── templates/                   # Email/doc templates
│   ├── scripts/
│   │   └── seed.js                  # Database seeding
│   ├── server.js                    # Express entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Layout.jsx           # Main app layout
│   │   │   ├── DataTable.jsx        # Data table component
│   │   │   ├── StatusBadge.jsx      # Status indicators
│   │   │   ├── Modal.jsx            # Modal dialog
│   │   │   ├── LoadingSpinner.jsx   # Loading indicator
│   │   │   ├── VroomXLogo.jsx       # Branded logo
│   │   │   ├── CompanySwitcher.jsx  # Multi-company switcher
│   │   │   ├── CSAChecker.jsx       # CSA checker widget
│   │   │   ├── PublicHeader.jsx     # Public page header
│   │   │   └── AIChat/              # AI chat components
│   │   ├── pages/                   # Page components (25 pages)
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── Drivers.jsx          # Driver list
│   │   │   ├── DriverDetail.jsx     # Driver DQF details
│   │   │   ├── Vehicles.jsx         # Vehicle list
│   │   │   ├── VehicleDetail.jsx    # Vehicle details
│   │   │   ├── Violations.jsx       # Violation tracker
│   │   │   ├── DrugAlcohol.jsx      # D&A testing
│   │   │   ├── Documents.jsx        # Document library
│   │   │   ├── Compliance.jsx       # Compliance dashboard
│   │   │   ├── Reports.jsx          # Report generation
│   │   │   ├── AlertsDashboard.jsx  # Alert management
│   │   │   ├── Tickets.jsx          # Support tickets
│   │   │   ├── DamageClaims.jsx     # Damage claims
│   │   │   ├── CSAEstimator.jsx     # CSA estimator tool
│   │   │   ├── TemplateGenerator.jsx # Template builder
│   │   │   ├── RegulationAssistant.jsx # AI regulation help
│   │   │   ├── AIAssistant.jsx      # VroomX AI chat
│   │   │   ├── Settings.jsx         # Settings & billing
│   │   │   ├── Billing.jsx          # Subscription management
│   │   │   ├── Landing.jsx          # Public landing page
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Register.jsx         # Registration
│   │   │   ├── Blog.jsx             # Blog content
│   │   │   └── InspectionUpload.jsx # Inspection upload
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Authentication state
│   │   │   └── ThemeContext.jsx     # Theme management
│   │   ├── utils/
│   │   │   ├── api.js               # Axios API client
│   │   │   └── helpers.js           # Utility functions
│   │   ├── App.jsx                  # Main app with routing
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── MOCKUPS/                         # UI design references
└── README.md
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure .env (see Environment Variables below)

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:5001` (backend).

---

## Environment Variables

### Backend `.env`

```env
# Server
PORT=5001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Authentication
JWT_SECRET=your-secure-jwt-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# FMCSA API (optional)
FMCSA_API_KEY=your-fmcsa-api-key
FMCSA_API_BASE_URL=https://mobile.fmcsa.dot.gov/qc/services

# AI Integration
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
AI_MODEL=claude-sonnet-4-20250514
AI_MAX_TOKENS=2048

# Stripe Billing (optional)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
FROM_EMAIL=noreply@vroomxsafety.com
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5001/api
```

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register company & admin |
| POST | `/login` | User login |
| GET | `/me` | Get current user |
| PUT | `/updatepassword` | Change password |
| POST | `/users` | Create team member |
| GET | `/users` | List team members |
| DELETE | `/users/:id` | Remove team member |

### Drivers (`/api/drivers`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List drivers (with filters) |
| GET | `/:id` | Get driver details |
| POST | `/` | Create driver |
| PUT | `/:id` | Update driver |
| DELETE | `/:id` | Terminate driver |
| POST | `/:id/documents` | Upload document |
| POST | `/:id/mvr` | Add MVR review |
| GET | `/alerts` | Get expiring documents |
| GET | `/stats` | Get statistics |

### Vehicles (`/api/vehicles`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List vehicles |
| GET | `/:id` | Get vehicle details |
| POST | `/` | Add vehicle |
| PUT | `/:id` | Update vehicle |
| DELETE | `/:id` | Mark as sold |
| POST | `/:id/maintenance` | Add maintenance |
| POST | `/:id/inspection` | Record inspection |
| POST | `/:id/dvir` | Add DVIR record |

### Violations (`/api/violations`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List violations |
| GET | `/:id` | Get violation details |
| POST | `/` | Add violation |
| PUT | `/:id` | Update violation |
| POST | `/:id/dataq` | Submit DataQ challenge |
| PUT | `/:id/dataq/status` | Update DataQ status |
| POST | `/:id/resolve` | Mark resolved |
| GET | `/stats` | Get statistics |

### Drug & Alcohol (`/api/drug-alcohol`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List test records |
| POST | `/` | Add test record |
| PUT | `/:id` | Update test |
| POST | `/:id/clearinghouse` | Report to Clearinghouse |
| GET | `/stats` | Get D&A statistics |
| POST | `/clearinghouse-query` | Record query |

### Documents (`/api/documents`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List documents |
| POST | `/` | Upload document |
| POST | `/bulk` | Bulk upload |
| PUT | `/:id` | Update metadata |
| DELETE | `/:id` | Delete document |
| GET | `/expiring` | Get expiring docs |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get dashboard data |
| PUT | `/basics` | Update SMS BASICs |
| GET | `/audit-readiness` | Audit checklist |

### Reports (`/api/reports`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dqf` | DQF report (PDF) |
| GET | `/vehicle-maintenance` | Vehicle report |
| GET | `/violations` | Violations report |
| GET | `/audit` | Full audit report |

### AI (`/api/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | AI chat completion |
| POST | `/analyze-document` | Document analysis |
| GET | `/regulation/:topic` | Regulation lookup |

### CSA (`/api/csa`, `/api/csa-checker`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/estimate` | Estimate CSA impact |
| POST | `/calculate` | Calculate scores |
| GET | `/lookup/:dot` | Lookup carrier |

### FMCSA (`/api/fmcsa`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lookup/:dot` | SAFER lookup |
| GET | `/carrier/:dot` | Carrier details |

### Companies (`/api/companies`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's companies |
| POST | `/` | Create company |
| PUT | `/:id` | Update company |
| DELETE | `/:id` | Delete company |

### Billing (`/api/billing`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subscription` | Get subscription |
| POST | `/create-checkout` | Create checkout |
| POST | `/webhook` | Stripe webhook |
| POST | `/cancel` | Cancel subscription |

---

## Database Models

### User
- `email`, `password` (hashed), `firstName`, `lastName`
- `role`: admin, safety_manager, dispatcher, driver, viewer
- `company` (reference), `permissions`, `isActive`

### Company
- `name`, `dotNumber`, `mcNumber`, `address`
- `smsBASICs` (7 categories with percentile)
- `subscription` (plan, status, limits)

### Driver
- `firstName`, `lastName`, `dateOfBirth`, `ssn` (encrypted)
- `cdl` (number, class, state, endorsements, expiration)
- `medicalCard` (examinerName, expirationDate, restrictions)
- `documents[]`, `mvrHistory[]`, `employmentHistory[]`
- `status`: active, inactive, terminated

### Vehicle
- `unitNumber`, `vin`, `year`, `make`, `model`, `type`
- `licensePlate`, `state`, `registration`
- `annualInspection` (date, location, expiration)
- `maintenanceRecords[]`, `dvirRecords[]`
- `status`: active, out_of_service, sold

### Violation
- `inspectionNumber`, `inspectionDate`, `state`
- `violationCode`, `description`, `severity`
- `basicCategory`, `points`, `weight`
- `dataQ` (status, filedDate, outcome)

### DrugAlcoholTest
- `driver` (reference), `testType`, `testDate`
- `result`, `substance`, `collector`, `mroName`
- `clearinghouseReported`, `reportedDate`

---

## FMCSA Compliance Logic

### Driver Qualification (49 CFR 391)
- CDL validation and expiration tracking
- Medical card validity (2 years)
- Annual MVR review requirement
- 10-year employment verification
- Annual Clearinghouse query
- Road test certification

### Vehicle Maintenance (49 CFR 396)
- Annual DOT inspection tracking
- Preventive maintenance scheduling
- DVIR records maintenance
- Out-of-service tracking

### Drug & Alcohol (49 CFR 382)
- Random testing rates: 50% drug, 10% alcohol
- Pre-employment testing requirement
- Post-accident testing criteria
- Clearinghouse reporting
- Return-to-duty process

### SMS BASICs Intervention Thresholds
| BASIC Category | Threshold |
|---------------|-----------|
| Unsafe Driving | 65% |
| HOS Compliance | 65% |
| Vehicle Maintenance | 80% |
| Controlled Substances | 80% |
| Driver Fitness | 80% |
| Crash Indicator | 65% |
| Hazmat (if applicable) | 80% |

---

## Security Features

- JWT authentication with expiration
- Password hashing with bcrypt (10 rounds)
- Role-based access control (RBAC)
- Company data isolation (multi-tenancy)
- Secure file upload with type validation
- Input validation with express-validator
- Helmet.js security headers
- Rate limiting on sensitive endpoints
- CORS configuration

---

## Deployment

### Backend (Render)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variables
6. Deploy

### Frontend (Netlify/Vercel)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_URL`
5. Deploy

---

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access, user management, billing |
| **Safety Manager** | All compliance features, no billing |
| **Dispatcher** | View drivers/vehicles, limited edits |
| **Driver** | View own profile, upload documents |
| **Viewer** | Read-only access |

---

## License

Proprietary - VroomX Safety

---

## Support

- **Email:** support@vroomxsafety.com
- **Website:** [vroomxsafety.com](https://vroomxsafety.com)
