import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Payroll from "@/models/Payroll";

// PATCH /api/payroll/[id] — mark Paid / Unpaid
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    if (!status || !["Paid", "Unpaid"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }
    await connectDB();
    const updated = await Payroll.findByIdAndUpdate(
      params.id,
      { status },
      { new: true }
    ).populate("employee", "name designation");
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Payroll not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/payroll/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to update payroll" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const deleted = await Payroll.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Payroll not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error("DELETE /api/payroll/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete payroll" },
      { status: 500 }
    );
  }
}
