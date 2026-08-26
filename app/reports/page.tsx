"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Users,
  Stethoscope,
  Building2,
  CalendarDays,
  DollarSign,
  AlertTriangle,
  Boxes,
  TrendingDown,
} from "lucide-react";
import { Spinner, EmptyState } from "@/components/ui";
import {
  GenderPie,
  SpecializationBar,
  BillingBar,
} from "@/components/ReportCharts";

interface Report {
  totals: {
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    totalDepartments: number;
    totalRevenue: number;
    outstanding: number;
    lowStock: number;
    inventoryValue: number;
  };
  gender: { name: string; value: number }[];
  appointmentStatus: { name: string; value: number }[];
  specialization: { name: string; doctors: number }[];
  billing: { name: string; amount: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/reports");
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setData(json.data);
      } catch {
        toast.error("Could not load reports");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner label="Building reports..." />;
  if (!data) return <EmptyState message="No report data." />;

  const t = data.totals;
  const kpis = [
    { label: "Patients", value: t.totalPatients, icon: Users, color: "bg-blue-500" },
    { label: "Doctors", value: t.totalDoctors, icon: Stethoscope, color: "bg-indigo-500" },
    { label: "Departments", value: t.totalDepartments, icon: Building2, color: "bg-purple-500" },
    { label: "Appointments", value: t.totalAppointments, icon: CalendarDays, color: "bg-amber-500" },
    { label: "Revenue", value: `$${t.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-green-500" },
    { label: "Outstanding", value: `$${t.outstanding.toLocaleString()}`, icon: TrendingDown, color: "bg-red-500" },
    { label: "Inventory Value", value: `$${t.inventoryValue.toLocaleString()}`, icon: Boxes, color: "bg-teal-500" },
    { label: "Low Stock", value: t.lowStock, icon: AlertTriangle, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card flex items-center gap-3 p-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-white ${k.color}`}
              >
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{k.label}</p>
                <p className="text-lg font-bold text-slate-900">{k.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">
            Patients by Gender
          </h2>
          {data.gender.length ? (
            <GenderPie data={data.gender} />
          ) : (
            <EmptyState message="No patient data." />
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">
            Doctors by Specialization
          </h2>
          {data.specialization.length ? (
            <SpecializationBar data={data.specialization} />
          ) : (
            <EmptyState message="No doctor data." />
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">
            Revenue: Collected vs Outstanding
          </h2>
          <BillingBar data={data.billing} />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">
            Appointments by Status
          </h2>
          {data.appointmentStatus.length ? (
            <BillingBar
              data={data.appointmentStatus.map((a) => ({
                name: a.name,
                amount: a.value,
              }))}
            />
          ) : (
            <EmptyState message="No appointment data." />
          )}
        </div>
      </div>
    </div>
  );
}
