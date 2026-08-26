import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Payroll from "@/models/Payroll";
import "@/models/Employee";

export async function GET() {
  try {
    await connectDB();
    const payrolls = await Payroll.find()
      .populate("employee", "name designation")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, data: payrolls });
  } catch (error) {
    console.error("GET /api/payroll", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch payroll" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { employee, month, basic, allowances, deductions } = await req.json();
    if (!employee || !month || basic === undefined || basic === "") {
      return NextResponse.json(
        { success: false, message: "Employee, month and basic salary are required" },
        { status: 400 }
      );
    }
    const b = Number(basic);
    const a = Number(allowances) || 0;
    const d = Number(deductions) || 0;
    const netPay = b + a - d;

    await connectDB();
    const payroll = await Payroll.create({
      employee,
      month,
      basic: b,
      allowances: a,
      deductions: d,
      netPay,
    });
    return NextResponse.json({ success: true, data: payroll }, { status: 201 });
  } catch (error) {
    console.error("POST /api/payroll", error);
    return NextResponse.json(
      { success: false, message: "Failed to create payroll" },
      { status: 500 }
    );
  }
}
