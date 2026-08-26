import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MedicalRecord from "@/models/MedicalRecord";
import { getSession } from "@/lib/session";
import "@/models/Patient";
import "@/models/Doctor";

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();

    const filter: Record<string, unknown> = {};
    if (session?.role === "Doctor" && session.doctorId) {
      filter.doctor = session.doctorId;
    }

    const records = await MedicalRecord.find(filter)
      .populate("patient", "name")
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("GET /api/records", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch records" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { doctor } = body;
    const { patient, diagnosis, prescription, notes, date } = body;

    const session = await getSession();
    // A Doctor can only write records under their own name, no matter
    // what the client sends.
    if (session?.role === "Doctor" && session.doctorId) {
      doctor = session.doctorId;
    }

    if (!patient || !doctor || !diagnosis || !date) {
      return NextResponse.json(
        {
          success: false,
          message: "Patient, doctor, diagnosis and date are required",
        },
        { status: 400 }
      );
    }
    await connectDB();
    const record = await MedicalRecord.create({
      patient,
      doctor,
      diagnosis,
      prescription,
      notes,
      date,
    });
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("POST /api/records", error);
    return NextResponse.json(
      { success: false, message: "Failed to create record" },
      { status: 500 }
    );
  }
}
