import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/models/Patient";
import Appointment from "@/models/Appointment";
import Bill from "@/models/Bill";
import Sale from "@/models/Sale";

// GET /api/ledger/all?filter=all|appointments — a consolidated ledger
// summary across multiple patients, for the "All Patients" PDF report.
// filter=appointments restricts the list to patients who have at least
// one appointment on record.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    await connectDB();

    let patientQuery: Record<string, unknown> = {};
    if (filter === "appointments") {
      const ids = await Appointment.distinct("patient");
      patientQuery = { _id: { $in: ids } };
    }

    const patients = await Patient.find(patientQuery).sort({ name: 1 }).lean();

    const rows = await Promise.all(
      patients.map(async (p: any) => {
        const [bills, sales] = await Promise.all([
          Bill.find({ patient: p._id }).lean(),
          Sale.find({ patient: p._id }).lean(),
        ]);
        const billedFromBills = bills.reduce((s, b: any) => s + b.amount, 0);
        const billedFromSales = sales.reduce((s, x: any) => s + x.total, 0);
        const paidFromBills = bills
          .filter((b: any) => b.status === "Paid")
          .reduce((s, b: any) => s + b.amount, 0);
        const totalBilled = billedFromBills + billedFromSales;
        // Pharmacy sales are paid on the spot, so they always count as paid
        const totalPaid = paidFromBills + billedFromSales;

        return {
          patient: { _id: p._id, name: p.name, age: p.age, gender: p.gender, phone: p.phone },
          totalBilled,
          totalPaid,
          outstanding: totalBilled - totalPaid,
          entryCount: bills.length + sales.length,
        };
      })
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("GET /api/ledger/all", error);
    return NextResponse.json(
      { success: false, message: "Failed to build consolidated ledger" },
      { status: 500 }
    );
  }
}
