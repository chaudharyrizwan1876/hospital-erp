import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export async function GET() {
  try {
    await connectDB();
    const medicines = await Medicine.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: medicines });
  } catch (error) {
    console.error("GET /api/medicines", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch medicines" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, category, stock, price, expiry } = await req.json();
    if (!name || stock === undefined || price === undefined) {
      return NextResponse.json(
        { success: false, message: "Name, stock and price are required" },
        { status: 400 }
      );
    }
    await connectDB();
    const medicine = await Medicine.create({
      name,
      category,
      stock: Number(stock),
      price: Number(price),
      expiry,
    });
    return NextResponse.json({ success: true, data: medicine }, { status: 201 });
  } catch (error) {
    console.error("POST /api/medicines", error);
    return NextResponse.json(
      { success: false, message: "Failed to create medicine" },
      { status: 500 }
    );
  }
}
