VroomX Safety Platform – Feature Expansion Module Specification


🆕 New Feature Modules (Detailed Scope for Development)
1. ✅ Tasks Module

Purpose:
Allow users to create, assign, and track simple or recurring tasks related to compliance (e.g. “Upload CDL”, “Schedule Inspection”).

Key Features:

Create tasks with:

Title

Description

Due Date

Priority (Low, Medium, High)

Assigned to: Driver, Staff, Admin

Recurring task support (e.g. every 90 days)

Task status: Not Started, In Progress, Completed

Filter and sort by:

Due date

Status

Priority

Assigned to

Automatic reminders for overdue tasks (via email/in-app)

Task can be linked to:

Driver profile (e.g. DQF document collection)

Vehicle file (e.g. inspection task)

Violation or Audit Checklist

Navigation Placement:

Main sidebar → "Tasks"

2. 📋 Checklist Templates Module

Purpose:
Enable users to standardize and re-use checklists for repeatable processes like onboarding, audits, maintenance, or file reviews.

Key Features:

Admins can:

Create checklist templates

Add checklist items with optional due dates and notes

Save and reuse templates for multiple drivers, audits, etc.

Assign checklists to a:

Driver (e.g. new hire onboarding)

Vehicle (e.g. maintenance checklist)

Company-wide audit prep

Progress tracking:

% completed view

Last updated by whom

Pre-built checklist templates to include:

"New Hire Driver Compliance"

"Annual File Review"

"Vehicle Inspection File Setup"

"Audit Readiness - Entry Level Audit"

Navigation Placement:

Main sidebar → "Checklists"

May also appear in Driver or Vehicle profile panels as "Assigned Checklists"

3. 🚨 Accident Register & Report Module (Tracking Category)

Purpose:
Enable users to log and manage accident incidents in compliance with FMCSA 49 CFR §390.15 while generating complete internal and external accident reports.

Key Features:

When creating a new record:

Prompt user to fill out accident form with:

Date & time of accident

Location (address, GPS optional)

Unit involved (select from vehicle list)

Driver involved (select from driver list)

CDL expiration date (auto-filled)

Was the driver cited? (Yes/No)

Tow-away? (Yes/No)

Medical transport? (Yes/No)

Fatalities? (Yes/No)

Hazmat release? (Yes/No)

Police report # / upload

Full narrative description

Road & weather conditions

Third-party info (optional)

Photos, documents (optional uploads)

Auto-tag whether incident qualifies as DOT-reportable based on FMCSA criteria

Exportable Accident Register (PDF, CSV)

Flags records missing required FMCSA data

Cross-Linked Views:

Driver Profile → Show all related incidents

Vehicle File → Show all related incidents

Navigation Placement:

Sidebar → "Tracking" → "Accidents"

4. 🛠️ Inspection & Maintenance Record (Tracking Category & Vehicle Files)

Purpose:
Digitally track preventive maintenance, inspections, and repairs in compliance with FMCSA 49 CFR Part 396.

Key Features:

Add new record:

Record Type: Preventive Maintenance / Annual DOT Inspection / Repair

Vehicle Unit (from vehicle list)

Date of service

Odometer reading (optional)

Maintenance provider/shop

Description of service

Upload invoice or form

Optional: Next scheduled service date

Label/tag inspection type for filtering

Export maintenance log per vehicle (PDF/CSV)

Cross-Linking:

Visible in:

Tracking → "Inspections & Maintenance"

Vehicle File → Specific Unit Maintenance tab

Highlight overdue inspections or recurring service due

Navigation Placement:

Sidebar → "Tracking" → "Maintenance"

Vehicle File → Maintenance Log Tab