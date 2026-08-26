import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Leave from "@/models/Leave";

// PATCH /api/leaves/[id] — approve / reject
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    const allowed = ["Pending", "Approved", "Rejected"];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }
    await connectDB();
    const updated = await Leave.findByIdAndUpdate(
      params.id,
      { status },
      { new: true }
    ).populate("employee", "name designation");
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Leave not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/leaves/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to update leave" },
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
    const deleted = await Leave.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Leave not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error("DELETE /api/leaves/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete leave" },
      { status: 500 }
    );
  }
}
