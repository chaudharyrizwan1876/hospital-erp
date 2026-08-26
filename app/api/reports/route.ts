import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";
import Appointment from "@/models/Appointment";
import Bill from "@/models/Bill";
import Medicine from "@/models/Medicine";
import Department from "@/models/Department";

export async function GET() {
  try {
    await connectDB();

    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalDepartments,
      bills,
      medicines,
      genderAgg,
      statusAgg,
      specAgg,
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Department.countDocuments(),
      Bill.find().lean(),
      Medicine.find().lean(),
      Patient.aggregate([{ $group: { _id: "$gender", count: { $sum: 1 } } }]),
      Appointment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Doctor.aggregate([
        { $group: { _id: "$specialization", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const totalRevenue = bills
      .filter((b: any) => b.status === "Paid")
      .reduce((s: number, b: any) => s + (b.amount || 0), 0);
    const outstanding = bills
      .filter((b: any) => b.status === "Unpaid")
      .reduce((s: number, b: any) => s + (b.amount || 0), 0);

    // Pharmacy insights
    const lowStock = medicines.filter((m: any) => m.stock <= 10).length;
    const inventoryValue = medicines.reduce(
      (s: number, m: any) => s + (m.price || 0) * (m.stock || 0),
      0
    );

    const gender = genderAgg.map((g: any) => ({
      name: g._id || "Unknown",
      value: g.count,
    }));
    const appointmentStatus = statusAgg.map((s: any) => ({
      name: s._id,
      value: s.count,
    }));
    const specialization = specAgg.map((s: any) => ({
      name: s._id || "General",
      doctors: s.count,
    }));

    // Billing split for a simple paid vs unpaid bar
    const billing = [
      { name: "Collected", amount: totalRevenue },
      { name: "Outstanding", amount: outstanding },
    ];

    return NextResponse.json({
      success: true,
      data: {
        totals: {
          totalPatients,
          totalDoctors,
          totalAppointments,
          totalDepartments,
          totalRevenue,
          outstanding,
          lowStock,
          inventoryValue,
        },
        gender,
        appointmentStatus,
        specialization,
        billing,
      },
    });
  } catch (error) {
    console.error("GET /api/reports", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
