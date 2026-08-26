import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Department from "@/models/Department";

export async function GET() {
  try {
    await connectDB();
    const departments = await Department.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error("GET /api/departments", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, head, description } = await req.json();
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Department name is required" },
        { status: 400 }
      );
    }
    await connectDB();
    const department = await Department.create({ name, head, description });
    return NextResponse.json(
      { success: true, data: department },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/departments", error);
    return NextResponse.json(
      { success: false, message: "Failed to create department" },
      { status: 500 }
    );
  }
}
