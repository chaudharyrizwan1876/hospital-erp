import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    if (body.stock !== undefined) body.stock = Number(body.stock);
    if (body.price !== undefined) body.price = Number(body.price);
    await connectDB();
    const updated = await Medicine.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Medicine not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/medicines/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to update medicine" },
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
    const deleted = await Medicine.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Medicine not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error("DELETE /api/medicines/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete medicine" },
      { status: 500 }
    );
  }
}
