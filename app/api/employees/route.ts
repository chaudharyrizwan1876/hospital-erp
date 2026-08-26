import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function GET() {
  try {
    await connectDB();
    const employees = await Employee.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    console.error("GET /api/employees", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, designation, salary } = body;
    if (!name || !designation || salary === undefined || salary === "") {
      return NextResponse.json(
        { success: false, message: "Name, designation and salary are required" },
        { status: 400 }
      );
    }
    await connectDB();
    const employee = await Employee.create({
      ...body,
      salary: Number(salary),
    });
    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error) {
    console.error("POST /api/employees", error);
    return NextResponse.json(
      { success: false, message: "Failed to create employee" },
      { status: 500 }
    );
  }
}
