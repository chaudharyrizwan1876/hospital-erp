import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Return from "@/models/Return";
import Medicine from "@/models/Medicine";

export async function GET() {
  try {
    await connectDB();

    const returns = await Return.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    console.error("GET /api/returns", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch returns",
      },
      { status: 500 }
    );
  }
}


// POST /api/returns
//
// Manual return entry.
// Existing manual return functionality is preserved.
//
// Sale-based returns should normally come from
// PATCH /api/sales.
export async function POST(req: Request) {
  try {
    const {
      medicine,
      patientName,
      quantity,
      reason,
      date,
    } = await req.json();

    const qty = Number(quantity);

    if (!medicine || !qty || qty < 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Medicine and a valid quantity are required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const med = await Medicine.findById(
      medicine
    );

    if (!med) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected medicine no longer exists",
        },
        { status: 400 }
      );
    }

    const refund = med.price * qty;

    // Add returned quantity back to stock
    await Medicine.findByIdAndUpdate(
      medicine,
      {
        $inc: {
          stock: qty,
        },
      }
    );

    const record = await Return.create({
      medicine: med._id,
      name: med.name,
      patientName,
      quantity: qty,
      refund,
      reason,
      date:
        date ||
        new Date().toISOString().slice(0, 10),
    });

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/returns", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to record return",
      },
      { status: 500 }
    );
  }
}