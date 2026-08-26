/**
 * Seed script — populates the database with dummy data.
 * Run with:  npm run seed
 */
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI missing in .env.local");
  process.exit(1);
}

// Inline schemas (JS mirror of /models) so this script is standalone.
const Patient = mongoose.model(
  "Patient",
  new mongoose.Schema(
    {
      name: String,
      age: Number,
      gender: String,
      disease: String,
      phone: String,
    },
    { timestamps: true }
  )
);
const Doctor = mongoose.model(
  "Doctor",
  new mongoose.Schema(
    {
      name: String,
      specialization: String,
      department: String,
      phone: String,
      email: String,
    },
    { timestamps: true }
  )
);
const Department = mongoose.model(
  "Department",
  new mongoose.Schema(
    { name: String, head: String, description: String },
    { timestamps: true }
  )
);
const Medicine = mongoose.model(
  "Medicine",
  new mongoose.Schema(
    { name: String, category: String, stock: Number, price: Number, expiry: String },
    { timestamps: true }
  )
);
const Admin = mongoose.model(
  "Admin",
  new mongoose.Schema(
    { username: String, password: String, name: String, role: String },
    { timestamps: true }
  )
);
const Employee = mongoose.model(
  "Employee",
  new mongoose.Schema(
    {
      name: String,
      designation: String,
      department: String,
      joiningDate: String,
      salary: Number,
      phone: String,
      email: String,
      status: String,
    },
    { timestamps: true }
  )
);
const Attendance = mongoose.model(
  "Attendance",
  new mongoose.Schema(
    {
      employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      date: String,
      status: String,
    },
    { timestamps: true }
  )
);
const Leave = mongoose.model(
  "Leave",
  new mongoose.Schema(
    {
      employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      type: String,
      fromDate: String,
      toDate: String,
      reason: String,
      status: String,
    },
    { timestamps: true }
  )
);
const Payroll = mongoose.model(
  "Payroll",
  new mongoose.Schema(
    {
      employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      month: String,
      basic: Number,
      allowances: Number,
      deductions: Number,
      netPay: Number,
      status: String,
    },
    { timestamps: true }
  )
);
const Sale = mongoose.model(
  "Sale",
  new mongoose.Schema(
    {
      patientName: String,
      patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
      items: [
        {
          medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
          name: String,
          quantity: Number,
          price: Number,
          subtotal: Number,
          _id: false,
        },
      ],
      total: Number,
      date: String,
    },
    { timestamps: true }
  )
);
const Return = mongoose.model(
  "Return",
  new mongoose.Schema(
    {
      medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
      name: String,
      patientName: String,
      quantity: Number,
      refund: Number,
      reason: String,
      date: String,
    },
    { timestamps: true }
  )
);
const MedicalRecord = mongoose.model(
  "MedicalRecord",
  new mongoose.Schema(
    {
      patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
      doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
      diagnosis: String,
      prescription: String,
      notes: String,
      date: String,
    },
    { timestamps: true }
  )
);
const Appointment = mongoose.model(
  "Appointment",
  new mongoose.Schema(
    {
      patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
      doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
      date: String,
      time: String,
      status: String,
    },
    { timestamps: true }
  )
);
const Bill = mongoose.model(
  "Bill",
  new mongoose.Schema(
    {
      patientName: String,
      patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
      appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
      amount: Number,
      status: String,
    },
    { timestamps: true }
  )
);

const today = new Date().toISOString().slice(0, 10);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Clear existing
  await Promise.all([
    Patient.deleteMany({}),
    Doctor.deleteMany({}),
    Appointment.deleteMany({}),
    Bill.deleteMany({}),
    Department.deleteMany({}),
    Medicine.deleteMany({}),
    MedicalRecord.deleteMany({}),
    Admin.deleteMany({}),
    Employee.deleteMany({}),
    Attendance.deleteMany({}),
    Leave.deleteMany({}),
    Payroll.deleteMany({}),
    Sale.deleteMany({}),
    Return.deleteMany({}),
  ]);
  console.log("Cleared old data");

  const hashed = await bcrypt.hash("admin123", 10);
  await Admin.insertMany([
    { username: "admin", password: hashed, name: "Administrator", role: "Admin" },
    { username: "doctor", password: hashed, name: "Dr. Imran Sheikh", role: "Doctor" },
    { username: "reception", password: hashed, name: "Bilal Ahmed", role: "Receptionist" },
    { username: "pharmacist", password: hashed, name: "Zoya Khan", role: "Pharmacist" },
    { username: "hrmanager", password: hashed, name: "Kashif Ali", role: "HR Manager" },
  ]);
  console.log("🔐 Inserted 5 login accounts (all password: admin123):");
  console.log("   admin / doctor / reception / pharmacist / hrmanager");

  const departments = await Department.insertMany([
    { name: "Cardiology", head: "Dr. Imran Sheikh", description: "Heart and vascular care" },
    { name: "Endocrinology", head: "Dr. Nadia Farooq", description: "Diabetes and hormones" },
    { name: "Pulmonology", head: "Dr. Kamran Aziz", description: "Lungs and respiratory" },
    { name: "Neurology", head: "Dr. Hina Raza", description: "Brain and nervous system" },
  ]);
  console.log(`🏢 Inserted ${departments.length} departments`);

  const patients = await Patient.insertMany([
    { name: "Ahmed Khan", age: 34, gender: "Male", disease: "Hypertension", phone: "0300-1234567" },
    { name: "Sara Ali", age: 28, gender: "Female", disease: "Diabetes", phone: "0301-2345678" },
    { name: "Bilal Hussain", age: 45, gender: "Male", disease: "Asthma", phone: "0302-3456789" },
    { name: "Ayesha Malik", age: 52, gender: "Female", disease: "Arthritis", phone: "0303-4567890" },
    { name: "Usman Tariq", age: 19, gender: "Male", disease: "Migraine", phone: "0304-5678901" },
    { name: "Fatima Noor", age: 31, gender: "Female", disease: "Anemia", phone: "0305-6789012" },
  ]);
  console.log(`👥 Inserted ${patients.length} patients`);

  const doctors = await Doctor.insertMany([
    { name: "Dr. Imran Sheikh", specialization: "Cardiologist", department: "Cardiology", phone: "0311-1112223", email: "imran@medicare.com" },
    { name: "Dr. Nadia Farooq", specialization: "Endocrinologist", department: "Endocrinology", phone: "0312-2223334", email: "nadia@medicare.com" },
    { name: "Dr. Kamran Aziz", specialization: "Pulmonologist", department: "Pulmonology", phone: "0313-3334445", email: "kamran@medicare.com" },
    { name: "Dr. Hina Raza", specialization: "Neurologist", department: "Neurology", phone: "0314-4445556", email: "hina@medicare.com" },
  ]);
  console.log(`🩺 Inserted ${doctors.length} doctors`);

  const appointments = await Appointment.insertMany([
    { patient: patients[0]._id, doctor: doctors[0]._id, date: today, time: "09:30", status: "Pending" },
    { patient: patients[1]._id, doctor: doctors[1]._id, date: today, time: "10:15", status: "Completed" },
    { patient: patients[2]._id, doctor: doctors[2]._id, date: today, time: "11:00", status: "Pending" },
    { patient: patients[3]._id, doctor: doctors[3]._id, date: "2026-08-20", time: "14:00", status: "Cancelled" },
    { patient: patients[4]._id, doctor: doctors[0]._id, date: "2026-08-21", time: "15:30", status: "Completed" },
    { patient: patients[5]._id, doctor: doctors[1]._id, date: today, time: "16:00", status: "Pending" },
  ]);
  console.log(`📅 Inserted ${appointments.length} appointments`);

  const bills = await Bill.insertMany([
    { patientName: "Ahmed Khan", patient: patients[0]._id, amount: 5000, status: "Paid" },
    // Linked to a Completed appointment — shows up as an invoice with doctor details
    { patientName: "Sara Ali", patient: patients[1]._id, appointment: appointments[1]._id, amount: 3500, status: "Unpaid" },
    { patientName: "Bilal Hussain", patient: patients[2]._id, amount: 8200, status: "Paid" },
    { patientName: "Ayesha Malik", patient: patients[3]._id, amount: 6000, status: "Unpaid" },
    { patientName: "Usman Tariq", patient: patients[4]._id, appointment: appointments[4]._id, amount: 2500, status: "Paid" },
  ]);
  console.log(`💰 Inserted ${bills.length} bills`);

  const medicines = await Medicine.insertMany([
    { name: "Paracetamol", category: "Tablet", stock: 250, price: 5, expiry: "2027-06-30" },
    { name: "Amoxicillin", category: "Capsule", stock: 8, price: 25, expiry: "2026-12-31" },
    { name: "Cough Syrup", category: "Syrup", stock: 40, price: 120, expiry: "2027-01-15" },
    { name: "Insulin", category: "Injection", stock: 6, price: 850, expiry: "2026-09-30" },
    { name: "Ibuprofen", category: "Tablet", stock: 180, price: 8, expiry: "2027-03-20" },
    { name: "Antiseptic Cream", category: "Ointment", stock: 55, price: 90, expiry: "2027-08-10" },
  ]);
  console.log(`💊 Inserted ${medicines.length} medicines`);

  const records = await MedicalRecord.insertMany([
    { patient: patients[0]._id, doctor: doctors[0]._id, diagnosis: "Stage 1 Hypertension", prescription: "Amlodipine 5mg daily", notes: "Monitor BP weekly", date: today },
    { patient: patients[1]._id, doctor: doctors[1]._id, diagnosis: "Type 2 Diabetes", prescription: "Metformin 500mg twice daily", notes: "Diet control advised", date: today },
    { patient: patients[2]._id, doctor: doctors[2]._id, diagnosis: "Mild Asthma", prescription: "Salbutamol inhaler", notes: "Avoid dust exposure", date: "2026-08-16" },
  ]);
  console.log(`Inserted ${records.length} medical records`);

  // ===== HR =====
  const employees = await Employee.insertMany([
    { name: "Sana Iqbal", designation: "Nurse", department: "Cardiology", joiningDate: "2024-03-01", salary: 45000, phone: "0321-1111111", email: "sana@medicare.com", status: "Active" },
    { name: "Bilal Ahmed", designation: "Receptionist", department: "Front Desk", joiningDate: "2023-11-15", salary: 35000, phone: "0321-2222222", email: "bilal@medicare.com", status: "Active" },
    { name: "Rukhsana Bibi", designation: "Ward Boy", department: "General", joiningDate: "2024-06-10", salary: 28000, phone: "0321-3333333", email: "rukhsana@medicare.com", status: "Active" },
    { name: "Tariq Mehmood", designation: "Lab Technician", department: "Pathology", joiningDate: "2022-08-20", salary: 52000, phone: "0321-4444444", email: "tariq@medicare.com", status: "Active" },
    { name: "Zoya Khan", designation: "Pharmacist", department: "Pharmacy", joiningDate: "2023-01-05", salary: 60000, phone: "0321-5555555", email: "zoya@medicare.com", status: "Active" },
    { name: "Kashif Ali", designation: "Accountant", department: "Finance", joiningDate: "2021-05-12", salary: 55000, phone: "0321-6666666", email: "kashif@medicare.com", status: "Inactive" },
  ]);
  console.log(`Inserted ${employees.length} employees`);

  await Attendance.insertMany([
    { employee: employees[0]._id, date: today, status: "Present" },
    { employee: employees[1]._id, date: today, status: "Present" },
    { employee: employees[2]._id, date: today, status: "Absent" },
    { employee: employees[3]._id, date: today, status: "Leave" },
    { employee: employees[4]._id, date: today, status: "Half Day" },
  ]);
  console.log("Inserted attendance for today");

  await Leave.insertMany([
    { employee: employees[0]._id, type: "Casual", fromDate: today, toDate: today, reason: "Personal work", status: "Pending" },
    { employee: employees[3]._id, type: "Sick", fromDate: "2026-08-18", toDate: "2026-08-20", reason: "Fever", status: "Approved" },
    { employee: employees[1]._id, type: "Annual", fromDate: "2026-09-01", toDate: "2026-09-07", reason: "Vacation", status: "Pending" },
  ]);
  console.log("Inserted 3 leave requests");

  const month = today.slice(0, 7);
  await Payroll.insertMany([
    { employee: employees[0]._id, month, basic: 45000, allowances: 5000, deductions: 2000, netPay: 48000, status: "Paid" },
    { employee: employees[3]._id, month, basic: 52000, allowances: 4000, deductions: 3000, netPay: 53000, status: "Unpaid" },
    { employee: employees[4]._id, month, basic: 60000, allowances: 8000, deductions: 2500, netPay: 65500, status: "Paid" },
  ]);
  console.log("Inserted 3 payslips");

  // ===== Pharmacy sales & returns (adjust stock accordingly) =====
  // Sale 1: Paracetamol x10, Ibuprofen x5
  const para = medicines.find((m) => m.name === "Paracetamol");
  const ibu = medicines.find((m) => m.name === "Ibuprofen");
  const syrup = medicines.find((m) => m.name === "Cough Syrup");

  await Sale.insertMany([
    {
      patientName: "Ahmed Khan",
      patient: patients[0]._id,
      items: [
        { medicine: para._id, name: para.name, quantity: 10, price: para.price, subtotal: para.price * 10 },
        { medicine: ibu._id, name: ibu.name, quantity: 5, price: ibu.price, subtotal: ibu.price * 5 },
      ],
      total: para.price * 10 + ibu.price * 5,
      date: today,
    },
    {
      patientName: "Sara Ali",
      patient: patients[1]._id,
      items: [
        { medicine: syrup._id, name: syrup.name, quantity: 2, price: syrup.price, subtotal: syrup.price * 2 },
      ],
      total: syrup.price * 2,
      date: today,
    },
  ]);
  // Decrease stock for sold items
  await Medicine.findByIdAndUpdate(para._id, { $inc: { stock: -10 } });
  await Medicine.findByIdAndUpdate(ibu._id, { $inc: { stock: -5 } });
  await Medicine.findByIdAndUpdate(syrup._id, { $inc: { stock: -2 } });
  console.log("Inserted 2 sales (stock decreased)");

  // Return: Paracetamol x3 back
  await Return.create({
    medicine: para._id,
    name: para.name,
    patientName: "Ahmed Khan",
    quantity: 3,
    refund: para.price * 3,
    reason: "Unused strips",
    date: today,
  });
  await Medicine.findByIdAndUpdate(para._id, { $inc: { stock: 3 } });
  console.log("Inserted 1 return (stock increased)");

  console.log("\nSeeding complete!");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
