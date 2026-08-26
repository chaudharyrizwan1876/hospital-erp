import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Leave from "@/models/Leave";
import "@/models/Employee";

export async function GET() {
  try {
    await connectDB();
    const leaves = await Leave.find()
      .populate("employee", "name designation")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, data: leaves });
  } catch (error) {
    console.error("GET /api/leaves", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch leaves" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { employee, type, fromDate, toDate, reason } = await req.json();
    if (!employee || !fromDate || !toDate) {
      return NextResponse.json(
        { success: false, message: "Employee, from and to dates are required" },
        { status: 400 }
      );
    }
    await connectDB();
    const leave = await Leave.create({
      employee,
      type,
      fromDate,
      toDate,
      reason,
    });
    return NextResponse.json({ success: true, data: leave }, { status: 201 });
  } catch (error) {
    console.error("POST /api/leaves", error);
    return NextResponse.json(
      { success: false, message: "Failed to create leave request" },
      { status: 500 }
    );
  }
}
