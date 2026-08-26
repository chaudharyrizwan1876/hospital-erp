import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Sale from "@/models/Sale";
import Appointment from "@/models/Appointment";
import "@/models/Patient";
import "@/models/Doctor";

// GET /api/billing/[id] — a single bill for the invoice view, plus the
// pharmacy sales this bill claimed at creation time.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const bill = await Bill.findById(params.id)
      .populate("patient", "name age gender phone")
      .populate({
        path: "appointment",
        select: "date time doctor",
        populate: { path: "doctor", select: "name specialization" },
      })
      .lean<any>();

    if (!bill) {
      return NextResponse.json(
        { success: false, message: "Bill not found" },
        { status: 404 }
      );
    }

    const relatedSales = await Sale.find({ bill: params.id }).lean();

    return NextResponse.json({
      success: true,
      data: { ...bill, relatedSales },
    });
  } catch (error) {
    console.error("GET /api/billing/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bill" },
      { status: 500 }
    );
  }
}

// PATCH /api/billing/[id] — mark a bill Paid or Unpaid
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    const allowed = ["Paid", "Unpaid"];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }

    await connectDB();
    const updated = await Bill.findByIdAndUpdate(
      params.id,
      { status },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Bill not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/billing/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to update bill" },
      { status: 500 }
    );
  }
}
