import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Patient from "@/models/Patient";
import Doctor from "@/models/Doctor";
import Appointment from "@/models/Appointment";
import Bill from "@/models/Bill";
import Department from "@/models/Department";
import Medicine from "@/models/Medicine";

// GET /api/stats — dashboard aggregates
export async function GET() {
  try {
    await connectDB();

    // Today's date as a local YYYY-MM-DD string, matching how the
    // <input type="date"> field and the seed store appointment dates.
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;

    const [
      totalPatients,
      totalDoctors,
      totalDepartments,
      todaysAppointments,
      pendingAppointments,
      paidBills,
      unpaidBills,
      lowStock,
      recentPatients,
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Department.countDocuments(),
      Appointment.countDocuments({ date: todayStr }),
      Appointment.countDocuments({ status: "Pending" }),
      Bill.find({ status: "Paid" }).lean(),
      Bill.countDocuments({ status: "Unpaid" }),
      Medicine.countDocuments({ stock: { $lte: 10 } }),
      Patient.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const totalRevenue = paidBills.reduce((sum, b: any) => sum + (b.amount || 0), 0);

    // Appointment status breakdown for chart
    const statuses = await Appointment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusMap: Record<string, number> = {
      Pending: 0,
      Completed: 0,
      Cancelled: 0,
    };
    statuses.forEach((s: any) => {
      statusMap[s._id] = s.count;
    });
    const chart = Object.entries(statusMap).map(([name, value]) => ({
      name,
      appointments: value,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        totalDepartments,
        todaysAppointments,
        pendingAppointments,
        unpaidBills,
        lowStock,
        totalRevenue,
        recentPatients,
        chart,
      },
    });
  } catch (error) {
    console.error("GET /api/stats", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
