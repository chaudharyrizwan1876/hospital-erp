import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Sale from "@/models/Sale";
import Patient from "@/models/Patient";
import "@/models/Appointment";
import "@/models/Doctor";

// GET /api/ledger?patientId=... — a single patient's full financial
// statement: every consultation bill + every pharmacy sale, merged and
// sorted by date, with running totals. Pharmacy sales are treated as
// paid on the spot (that's how the Sales screen works today).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { success: false, message: "patientId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const patient = await Patient.findById(patientId).lean();
    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 }
      );
    }

    const [bills, sales] = await Promise.all([
      Bill.find({ patient: patientId })
        .populate({
          path: "appointment",
          select: "date doctor",
          populate: { path: "doctor", select: "name" },
        })
        .sort({ createdAt: -1 })
        .lean<any[]>(),
      Sale.find({ patient: patientId }).sort({ createdAt: -1 }).lean<any[]>(),
    ]);

    const entries = [
      ...bills.map((b) => ({
        id: String(b._id),
        date: b.appointment?.date || b.createdAt.toISOString().slice(0, 10),
        type: "Consultation",
        description: b.appointment?.doctor?.name
          ? `Consultation with ${b.appointment.doctor.name}`
          : "Consultation",
        amount: b.amount,
        status: b.status,
        billId: String(b._id),
      })),
      ...sales.map((s) => ({
        id: String(s._id),
        date: s.date,
        type: "Pharmacy",
        description: `Pharmacy: ${s.items.map((it: any) => `${it.name} x${it.quantity}`).join(", ")}`,
        amount: s.total,
        status: "Paid",
        billId: null,
      })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1));

    const totalBilled = entries.reduce((s, e) => s + e.amount, 0);
    const totalPaid = entries
      .filter((e) => e.status === "Paid")
      .reduce((s, e) => s + e.amount, 0);
    const outstanding = totalBilled - totalPaid;

    return NextResponse.json({
      success: true,
      data: { patient, entries, totalBilled, totalPaid, outstanding },
    });
  } catch (error) {
    console.error("GET /api/ledger", error);
    return NextResponse.json(
      { success: false, message: "Failed to build ledger" },
      { status: 500 }
    );
  }
}
