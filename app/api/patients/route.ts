import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/models/Patient";
import Appointment from "@/models/Appointment";
import MedicalRecord from "@/models/MedicalRecord";
import { getSession } from "@/lib/session";

// GET /api/patients — list patients. A Doctor only sees patients they
// have an appointment or medical record with.
export async function GET() {
  try {
    await connectDB();
    const session = await getSession();

    if (session?.role === "Doctor" && session.doctorId) {
      const [fromAppointments, fromRecords] = await Promise.all([
        Appointment.distinct("patient", { doctor: session.doctorId }),
        MedicalRecord.distinct("patient", { doctor: session.doctorId }),
      ]);
      const ids = Array.from(
        new Set([...fromAppointments, ...fromRecords].map(String))
      );
      const patients = await Patient.find({ _id: { $in: ids } })
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ success: true, data: patients });
    }

    const patients = await Patient.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: patients });
  } catch (error) {
    console.error("GET /api/patients", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

// POST /api/patients — create a patient. Doctors are view-only here;
// registration is handled by reception/admin.
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (session?.role === "Doctor") {
      return NextResponse.json(
        { success: false, message: "Doctors cannot register patients. Ask reception." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, age, gender, disease, phone } = body;

    if (!name || age === undefined || !gender || !disease || !phone) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const patient = await Patient.create({ name, age, gender, disease, phone });
    return NextResponse.json(
      { success: true, data: patient },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/patients", error);
    return NextResponse.json(
      { success: false, message: "Failed to create patient" },
      { status: 500 }
    );
  }
}
