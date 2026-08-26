import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/models/Patient";
import Appointment from "@/models/Appointment";
import MedicalRecord from "@/models/MedicalRecord";
import Bill from "@/models/Bill";
import Sale from "@/models/Sale";
import { getSession } from "@/lib/session";

// PATCH /api/patients/[id] — update a patient (Doctors are view-only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (session?.role === "Doctor") {
      return NextResponse.json(
        { success: false, message: "Doctors cannot edit patient records" },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (body.age !== undefined) body.age = Number(body.age);
    await connectDB();
    const updated = await Patient.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/patients/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to update patient" },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] — remove a patient
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (session?.role === "Doctor") {
      return NextResponse.json(
        { success: false, message: "Doctors cannot delete patient records" },
        { status: 403 }
      );
    }

    await connectDB();
    const deleted = await Patient.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 }
      );
    }

    // Cascade — remove everything that references this patient so
    // appointments/records/bills/sales don't end up pointing at nothing.
    await Promise.all([
      Appointment.deleteMany({ patient: params.id }),
      MedicalRecord.deleteMany({ patient: params.id }),
      Bill.deleteMany({ patient: params.id }),
      Sale.deleteMany({ patient: params.id }),
    ]);

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error("DELETE /api/patients/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
