import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Appointment from "@/models/Appointment";
import Sale from "@/models/Sale";
import "@/models/Patient";
import "@/models/Doctor";

// GET /api/billing — list all bills. pharmacyAmount is a stored snapshot
// (set once, at bill creation) so the same medicine purchase never shows
// up on more than one bill.
export async function GET() {
  try {
    await connectDB();
    const bills = await Bill.find()
      .populate("appointment", "date time")
      .sort({ createdAt: -1 })
      .lean<any[]>();

    const withTotals = bills.map((bill) => ({
      ...bill,
      total: bill.amount + (bill.pharmacyAmount || 0),
    }));

    return NextResponse.json({ success: true, data: withTotals });
  } catch (error) {
    console.error("GET /api/billing", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}

// Pharmacy purchases for this patient on this day that no other bill has
// claimed yet — returns the total and the sale ids to mark as claimed.
async function findUnclaimedPharmacy(patientId: string, date: string) {
  const unclaimedSales = await Sale.find({
    patient: patientId,
    date,
    bill: null,
  }).lean();
  return {
    pharmacyAmount: unclaimedSales.reduce((s, x: any) => s + x.total, 0),
    saleIds: unclaimedSales.map((s: any) => String(s._id)),
  };
}

// POST /api/billing — create a bill.
// - appointmentId: bill is linked to that visit — patient name comes from
//   the appointment, re-billing the same visit is blocked, and unbilled
//   pharmacy purchases from that day are claimed onto this bill.
// - patientId (no appointment): a manual bill for a known patient
//   (including walk-ins registered from the Pharmacy screen) — claims
//   that patient's unbilled pharmacy purchases from today.
// - neither: a plain walk-in bill with just a name, no linking.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId, amount, status } = body;
    let { patientName, patientId } = body;

    if (amount === undefined || amount === "") {
      return NextResponse.json(
        { success: false, message: "Amount is required" },
        { status: 400 }
      );
    }

    await connectDB();

    let pharmacyAmount = 0;
    let claimedSaleIds: string[] = [];

    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId).populate(
        "patient",
        "name"
      );
      if (!appointment) {
        return NextResponse.json(
          { success: false, message: "Appointment not found" },
          { status: 404 }
        );
      }
      if (appointment.status !== "Completed") {
        return NextResponse.json(
          { success: false, message: "Only completed appointments can be billed" },
          { status: 400 }
        );
      }
      const existing = await Bill.findOne({ appointment: appointmentId });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "This appointment has already been billed" },
          { status: 400 }
        );
      }
      patientName = (appointment.patient as any)?.name || patientName;
      patientId = String((appointment.patient as any)?._id || appointment.patient);

      const claimed = await findUnclaimedPharmacy(patientId, appointment.date);
      pharmacyAmount = claimed.pharmacyAmount;
      claimedSaleIds = claimed.saleIds;
    } else if (patientId) {
      const today = new Date().toISOString().slice(0, 10);
      const claimed = await findUnclaimedPharmacy(patientId, today);
      pharmacyAmount = claimed.pharmacyAmount;
      claimedSaleIds = claimed.saleIds;
    }

    if (!patientName) {
      return NextResponse.json(
        { success: false, message: "Patient name is required" },
        { status: 400 }
      );
    }

    const bill = await Bill.create({
      patientName,
      patient: patientId,
      appointment: appointmentId || null,
      amount: Number(amount),
      pharmacyAmount,
      status: status || "Unpaid",
    });

    if (claimedSaleIds.length > 0) {
      await Sale.updateMany(
        { _id: { $in: claimedSaleIds } },
        { $set: { bill: bill._id } }
      );
    }

    return NextResponse.json({ success: true, data: bill }, { status: 201 });
  } catch (error) {
    console.error("POST /api/billing", error);
    return NextResponse.json(
      { success: false, message: "Failed to create bill" },
      { status: 500 }
    );
  }
}
