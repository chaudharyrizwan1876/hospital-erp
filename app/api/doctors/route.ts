import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import Admin from "@/models/Admin";

// GET /api/doctors — list all doctors
export async function GET() {
  try {
    await connectDB();
    const doctors = await Doctor.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: doctors });
  } catch (error) {
    console.error("GET /api/doctors", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}

// POST /api/doctors — create a doctor, optionally with a linked login
// account so that specific doctor can sign in and see only their own data.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, specialization, phone, email, username, password } = body;

    if (!name || !specialization || !phone || !email) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    await connectDB();

    if (username || password) {
      if (!username || !password) {
        return NextResponse.json(
          {
            success: false,
            message: "Provide both username and password to create a login, or leave both blank",
          },
          { status: 400 }
        );
      }
      const existing = await Admin.findOne({ username: username.trim() });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "That username is already taken" },
          { status: 400 }
        );
      }
    }

    const doctor = await Doctor.create({ name, specialization, phone, email });

    if (username && password) {
      const hashed = await bcrypt.hash(password, 10);
      await Admin.create({
        username: username.trim(),
        password: hashed,
        name,
        role: "Doctor",
        doctorId: doctor._id,
      });
    }

    return NextResponse.json({ success: true, data: doctor }, { status: 201 });
  } catch (error) {
    console.error("POST /api/doctors", error);
    return NextResponse.json(
      { success: false, message: "Failed to create doctor" },
      { status: 500 }
    );
  }
}
