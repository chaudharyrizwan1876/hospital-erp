import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { getSession } from "@/lib/session";

// PATCH /api/appointments/[id] — update status (Pending/Completed/Cancelled).
// A Doctor may only update the status of their own appointments.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    const allowed = ["Pending", "Completed", "Cancelled"];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }

    await connectDB();

    const session = await getSession();
    if (session?.role === "Doctor") {
      const appointment = await Appointment.findById(params.id);
      if (!appointment) {
        return NextResponse.json(
          { success: false, message: "Appointment not found" },
          { status: 404 }
        );
      }
      if (String(appointment.doctor) !== session.doctorId) {
        return NextResponse.json(
          { success: false, message: "You can only update your own appointments" },
          { status: 403 }
        );
      }
    }

    const updated = await Appointment.findByIdAndUpdate(
      params.id,
      { status },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Appointment not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/appointments/[id]", error);
    return NextResponse.json(
      { success: false, message: "Failed to update appointment" },
      { status: 500 }
    );
  }
}
