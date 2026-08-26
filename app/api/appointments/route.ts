import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { getSession } from "@/lib/session";
// Ensure referenced models are registered for populate()
import "@/models/Patient";
import "@/models/Doctor";

// GET /api/appointments — list appointments. A Doctor only sees their own.
export async function GET() {
  try {
    await connectDB();
    const session = await getSession();

    const filter: Record<string, unknown> = {};
    if (session?.role === "Doctor" && session.doctorId) {
      filter.doctor = session.doctorId;
    }

    const appointments = await Appointment.find(filter)
      .populate("patient", "name")
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    console.error("GET /api/appointments", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST /api/appointments — create an appointment.
// Doctors don't book their own appointments (front desk does), and a
// doctor can't have two appointments at the same date + time.
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (session?.role === "Doctor") {
      return NextResponse.json(
        { success: false, message: "Doctors cannot create appointments. Ask reception to book one." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { patient, doctor, date, time, status } = body;

    if (!patient || !doctor || !date || !time) {
      return NextResponse.json(
        { success: false, message: "Patient, doctor, date and time are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Clash check: same doctor can't be double-booked at the same slot
    const clash = await Appointment.findOne({
      doctor,
      date,
      time,
      status: { $ne: "Cancelled" },
    });
    if (clash) {
      return NextResponse.json(
        {
          success: false,
          message: "This doctor already has an appointment at that date and time. Pick a different slot.",
        },
        { status: 409 }
      );
    }

    const appointment = await Appointment.create({
      patient,
      doctor,
      date,
      time,
      status: status || "Pending",
    });
    return NextResponse.json(
      { success: true, data: appointment },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/appointments", error);
    return NextResponse.json(
      { success: false, message: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
