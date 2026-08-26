import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MedicalRecord from "@/models/MedicalRecord";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const deleted = await MedicalRecord.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Record not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error("DELETE /api/records/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete record" },
      { status: 500 }
    );
  }
}
