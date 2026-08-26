import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import Admin from "@/models/Admin";
import Appointment from "@/models/Appointment";
import MedicalRecord from "@/models/MedicalRecord";
import Bill from "@/models/Bill";

// PATCH /api/doctors/[id] — update a doctor
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    await connectDB();
    const updated = await Doctor.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/doctors/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to update doctor" },
      { status: 500 }
    );
  }
}

// DELETE /api/doctors/[id] — remove a doctor
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const deleted = await Doctor.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Doctor not found" },
        { status: 404 }
      );
    }

    // Cascade — remove everything that references this doctor.
    const orphanedAppointments = await Appointment.find({ doctor: params.id }).select("_id");
    const appointmentIds = orphanedAppointments.map((a) => a._id);

    await Promise.all([
      Admin.deleteMany({ doctorId: params.id }), // linked login account
      MedicalRecord.deleteMany({ doctor: params.id }),
      Bill.deleteMany({ appointment: { $in: appointmentIds } }),
      Appointment.deleteMany({ doctor: params.id }),
    ]);

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error("DELETE /api/doctors/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete doctor" },
      { status: 500 }
    );
  }
}
