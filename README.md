# MediCare — Hospital Management System (ERP)

A complete, production-ready Hospital ERP built with Next.js and MongoDB. It manages the full hospital workflow — patients, doctors, appointments, pharmacy, billing, and HR — with a separate role-based dashboard for every type of staff member.

<p align="center">
  <a href="https://hospital-erp-ashy.vercel.app/login">
    <img src="https://img.shields.io/badge/Live%20Demo-Open%20App-2563eb?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

## Live Demo

**[https://hospital-erp-ashy.vercel.app/login](https://hospital-erp-ashy.vercel.app/login)**

## Demo Logins

Every role has its own account. Password is the same for all: `admin123`

| Role | Username | Password | Access |
|---|---|---|---|
| Admin | `admin` | `admin123` | Full system access — every module, doctor account creation |
| Doctor | `doctor` | `admin123` | Own appointments, own patients, medical records only |
| Receptionist | `reception` | `admin123` | Patient registration, appointments, billing |
| Pharmacist | `pharmacist` | `admin123` | Medicine inventory, sales, returns |
| HR Manager | `hrmanager` | `admin123` | Employees, attendance, leave, payroll |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript
- **Styling**: Tailwind CSS (light/dark mode)
- **Auth**: Session-based login, bcrypt password hashing
- **Charts**: Recharts

## Modules

### Clinical
- Patient records — add, edit, search, full history
- Doctor management with department assignment
- Appointment booking with automatic double-booking prevention (a doctor can't be booked twice at the same date and time)
- Medical records and prescriptions per visit

### Pharmacy
- Medicine inventory with stock and expiry tracking
- Point-of-sale medicine billing with live stock deduction
- Returns processing with automatic stock restoration
- Walk-in customer support — no prior patient registration needed

### Billing & Finance
- Bills generated directly from completed appointments
- Pharmacy purchases automatically added to the correct bill, with no double-counting across visits
- Printable / downloadable PDF invoices
- Patient Ledger — full financial statement per patient, plus a consolidated all-patients report, both exportable as PDF

### Human Resources
- Employee records and daily attendance tracking
- Leave request and approval workflow
- Payroll generation with automatic net pay calculation

### Dashboard & Reports
- Real-time stats: patients, appointments, revenue, low stock alerts
- Visual analytics: gender distribution, specialization breakdown, billing trends

## Role-Based Access

| Screen | Admin | Doctor | Receptionist | Pharmacist | HR Manager |
|---|---|---|---|---|---|
| Dashboard | Yes | Yes | Yes | Yes | Yes |
| Patients | Yes | View only | Yes | — | — |
| Doctors / Departments | Yes | — | — | — | — |
| Appointments | Yes | View + status update | Yes | — | — |
| Medical Records | Yes | Yes | — | — | — |
| Pharmacy (Medicines / Sales / Returns) | Yes | — | — | Yes | — |
| Billing / Patient Ledger | Yes | — | Yes | — | — |
| Reports | Yes | — | — | — | — |
| Employees / Attendance / Leave / Payroll | Yes | — | — | — | Yes |

## Highlights

- Cascading data integrity — deleting a patient or doctor automatically cleans up all related appointments, records, bills, and sales
- Doctor accounts can be created directly from the Doctors screen with login access tied to that specific doctor
- Animated, secure login screen with session-based auth
- Fully responsive UI with dark mode support

## Getting Started

```bash
npm install
```

Create a `.env.local` file with your MongoDB connection string:

```
MONGODB_URI=your_mongodb_connection_string
```

Seed the database with demo data:

```bash
npm run seed
```

Run the development server:

```bash
npm run dev
```
