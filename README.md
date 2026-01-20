# Trucking Compliance Hub

A comprehensive FMCSA compliance management platform for small and medium-sized trucking companies. Built with React, Node.js/Express, and MongoDB.

## Features

### Core Modules

1. **Dashboard** - BASICs compliance overview with charts, alerts, and audit readiness
2. **Driver Qualification (DQF)** - Manage CDL, medical cards, MVRs per 49 CFR 391
3. **Vehicle Files** - Maintenance logs, annual inspections per 49 CFR 396
4. **Violation Tracker** - Track violations with DataQ dispute support
5. **Drug & Alcohol Program** - DOT testing and Clearinghouse compliance per 49 CFR 382
6. **Document Library** - Centralized document management with expiration tracking
7. **Reports & Audit** - PDF export for compliance audits

### Key Features

- Expiration tracking with alerts (30/14/7 days before)
- Status color badges (Valid, Due Soon, Expired)
- Role-based access control (Admin, Safety Manager, Dispatcher, Driver, Viewer)
- Secure file uploads (PDF, JPG, PNG)
- SMS BASICs threshold monitoring
- DataQ challenge workflow
- PDF report generation for audits

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Recharts, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Upload**: Multer
- **PDF Generation**: Puppeteer

## Project Structure

VroomX Safety/
├── backend/
│   ├── config/
│   │   ├── database.js           # MongoDB connection
│   │   └── fmcsaCompliance.js    # FMCSA regulations config
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── upload.js             # File upload handling
│   │   └── errorHandler.js       # Error handling
│   ├── models/
│   │   ├── User.js               # User with roles/permissions
│   │   ├── Company.js            # Company with SMS BASICs
│   │   ├── Driver.js             # Driver qualification files
│   │   ├── Vehicle.js            # Vehicle maintenance
│   │   ├── Violation.js          # Violations with DataQ
│   │   ├── DrugAlcoholTest.js    # D&A testing records
│   │   ├── Document.js           # Document library
│   │   └── Accident.js           # Accident register
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── drivers.js            # Driver CRUD
│   │   ├── vehicles.js           # Vehicle CRUD
│   │   ├── violations.js         # Violations & DataQ
│   │   ├── drugAlcohol.js        # D&A testing
│   │   ├── documents.js          # Document management
│   │   ├── dashboard.js          # Dashboard data
│   │   ├── accidents.js          # Accident records
│   │   └── reports.js            # PDF report generation
│   ├── server.js                 # Express server entry
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── context/              # React context (Auth)
│   │   ├── pages/                # Page components
│   │   ├── utils/                # API & helper functions
│   │   ├── App.jsx               # Main app with routing
│   │   └── main.jsx              # Entry point
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
└── MOCKUPS/                      # Design reference images
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Configure your MongoDB URI in .env
# MONGODB_URI=mongodb://localhost:27017/trucking_compliance_hub

# Start the server
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

### Environment Variables

Backend `.env`:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/trucking_compliance_hub
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register company & admin user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatepassword` - Change password
- `POST /api/auth/users` - Create team member (admin)
- `GET /api/auth/users` - List team members (admin)

### Drivers
- `GET /api/drivers` - List drivers (with filters)
- `GET /api/drivers/:id` - Get driver details
- `POST /api/drivers` - Create driver
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Terminate driver
- `POST /api/drivers/:id/documents` - Upload document
- `POST /api/drivers/:id/mvr` - Add MVR review
- `GET /api/drivers/alerts` - Get expiring documents
- `GET /api/drivers/stats` - Get driver statistics

### Vehicles
- `GET /api/vehicles` - List vehicles
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles` - Add vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Mark as sold
- `POST /api/vehicles/:id/maintenance` - Add maintenance record
- `POST /api/vehicles/:id/inspection` - Record annual inspection
- `POST /api/vehicles/:id/dvir` - Add DVIR record

### Violations
- `GET /api/violations` - List violations
- `GET /api/violations/:id` - Get violation details
- `POST /api/violations` - Add violation
- `PUT /api/violations/:id` - Update violation
- `POST /api/violations/:id/dataq` - Submit DataQ challenge
- `PUT /api/violations/:id/dataq/status` - Update DataQ status
- `POST /api/violations/:id/resolve` - Mark as resolved
- `GET /api/violations/stats` - Get violation statistics

### Drug & Alcohol
- `GET /api/drug-alcohol` - List test records
- `GET /api/drug-alcohol/:id` - Get test details
- `POST /api/drug-alcohol` - Add test record
- `PUT /api/drug-alcohol/:id` - Update test
- `POST /api/drug-alcohol/:id/clearinghouse` - Report to Clearinghouse
- `GET /api/drug-alcohol/stats` - Get D&A statistics
- `POST /api/drug-alcohol/clearinghouse-query` - Record query

### Documents
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document
- `POST /api/documents` - Upload document
- `POST /api/documents/bulk` - Bulk upload
- `PUT /api/documents/:id` - Update metadata
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/expiring` - Get expiring documents
- `GET /api/documents/stats` - Get statistics

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `PUT /api/dashboard/basics` - Update SMS BASICs
- `GET /api/dashboard/audit-readiness` - Get audit checklist

### Reports
- `GET /api/reports/dqf?format=pdf` - DQF report
- `GET /api/reports/vehicle-maintenance?format=pdf` - Vehicle report
- `GET /api/reports/violations?format=pdf` - Violations report
- `GET /api/reports/audit?format=pdf` - Full audit report

## FMCSA Compliance Logic

### Driver Qualification (49 CFR 391)
- CDL expiration tracking
- Medical card (2-year validity)
- Annual MVR review requirement
- Employment verification (10 years)
- Clearinghouse query (annual)
- Road test certification

### Vehicle Maintenance (49 CFR 396)
- Annual DOT inspection tracking
- Preventive maintenance scheduling
- DVIR records
- Maintenance log history

### Drug & Alcohol (49 CFR 382)
- Random testing rates (50% drug, 10% alcohol)
- Pre-employment testing
- Post-accident testing criteria
- Clearinghouse reporting
- Return-to-duty process

### SMS BASICs Thresholds
- Unsafe Driving: 65%
- HOS Compliance: 65%
- Vehicle Maintenance: 80%
- Controlled Substances: 80%
- Driver Fitness: 80%
- Crash Indicator: 65%

## Security Features

- JWT authentication with token expiration
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Company data isolation
- Secure file upload with type validation
- Input validation with express-validator

## License

MIT License - See LICENSE file for details.

## Support

For questions or issues, please open a GitHub issue.
