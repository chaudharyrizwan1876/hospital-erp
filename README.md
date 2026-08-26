<div align="center">

# 🏥 MediCare — Hospital Management System

**A complete, production-ready Hospital ERP** managing the full hospital workflow — patients, doctors, appointments, pharmacy, billing, and HR — with a dedicated role-based dashboard for every type of staff member.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Open_App-2563eb?style=for-the-badge)](https://hospital-erp-ashy.vercel.app/login)

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat-square&logo=next.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

</div>

---

## 🔗 Live Demo

### **[hospital-erp-ashy.vercel.app/login](https://hospital-erp-ashy.vercel.app/login)**

## 🔐 Demo Logins

Every role has its own account. Password is the same for all: `admin123`

| Role | Username | Password | Access |
|---|---|---|---|
| 👑 Admin | `admin` | `admin123` | Full system access — every module, doctor account creation |
| 🩺 Doctor | `doctor` | `admin123` | Own appointments, own patients, medical records only |
| 💼 Receptionist | `reception` | `admin123` | Patient registration, appointments, billing |
| 💊 Pharmacist | `pharmacist` | `admin123` | Medicine inventory, sales, returns |
| 📋 HR Manager | `hrmanager` | `admin123` | Employees, attendance, leave, payroll |

---

## ✨ Modules

### 🩹 Clinical
- Patient records — add, edit, search, full history
- Doctor management with department assignment
- Appointment booking with automatic double-booking prevention (a doctor can't be booked twice at the same date and time)
- Medical records and prescriptions per visit

### 💊 Pharmacy
- Medicine inventory with stock and expiry tracking
- Point-of-sale medicine billing with live stock deduction
- Returns processing with automatic stock restoration
- Walk-in customer support — no prior patient registration needed

### 💵 Billing & Finance
- Bills generated directly from completed appointments
- Pharmacy purchases automatically added to the correct bill, with no double-counting across visits
- Printable / downloadable PDF invoices
- Patient Ledger — full financial statement per patient, plus a consolidated all-patients report, both exportable as PDF

### 👥 Human Resources
- Employee records and daily attendance tracking
- Leave request and approval workflow
- Payroll generation with automatic net pay calculation

### 📊 Dashboard & Reports
- Real-time stats: patients, appointments, revenue, low stock alerts
- Visual analytics: gender distribution, specialization breakdown, billing trends

---

## 🗂️ Role-Based Access

| Screen | 👑 Admin | 🩺 Doctor | 💼 Receptionist | 💊 Pharmacist | 📋 HR Manager |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Patients | ✅ | View only | ✅ | — | — |
| Doctors / Departments | ✅ | — | — | — | — |
| Appointments | ✅ | View + status update | ✅ | — | — |
| Medical Records | ✅ | ✅ | — | — | — |
| Pharmacy (Medicines / Sales / Returns) | ✅ | — | — | ✅ | — |
| Billing / Patient Ledger | ✅ | — | ✅ | — | — |
| Reports | ✅ | — | — | — | — |
| Employees / Attendance / Leave / Payroll | ✅ | — | — | — | ✅ |

---

## ⚡ Highlights

- 🧹 **Cascading data integrity** — deleting a patient or doctor automatically cleans up all related appointments, records, bills, and sales
- 🔑 **Per-doctor login accounts** — created directly from the Doctors screen, each tied to that specific doctor's data
- 🎬 **Animated, secure login screen** with session-based auth
- 🌗 **Dark mode** and a fully responsive UI

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | MongoDB + Mongoose |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Session-based login, bcrypt password hashing |
| Charts | Recharts |

---

## 🚀 Getting Started

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
