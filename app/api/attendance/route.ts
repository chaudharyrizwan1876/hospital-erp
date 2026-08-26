import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import "@/models/Employee";

// GET /api/attendance?date=YYYY-MM-DD  -> records for that date (default today)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    await connectDB();
    const query = date ? { date } : {};
    const records = await Attendance.find(query)
      .populate("employee", "name designation")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("GET /api/attendance", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

// POST /api/attendance  -> mark (upsert) one employee's attendance for a date
export async function POST(req: Request) {
  try {
    const { employee, date, status } = await req.json();
    if (!employee || !date || !status) {
      return NextResponse.json(
        { success: false, message: "Employee, date and status are required" },
        { status: 400 }
      );
    }
    await connectDB();
    const record = await Attendance.findOneAndUpdate(
      { employee, date },
      { status },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("employee", "name designation");
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance", error);
    return NextResponse.json(
      { success: false, message: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}
