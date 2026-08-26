"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Users,
  Stethoscope,
  CalendarDays,
  DollarSign,
  Clock,
  Receipt,
  AlertTriangle,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Spinner, EmptyState } from "@/components/ui";
import AppointmentsChart from "@/components/AppointmentsChart";

interface Stats {
  totalPatients: number;
  totalDoctors: number;
  totalDepartments: number;
  todaysAppointments: number;
  pendingAppointments: number;
  unpaidBills: number;
  lowStock: number;
  totalRevenue: number;
  recentPatients: {
    _id: string;
    name: string;
    age: number;
    gender: string;
    disease: string;
    phone: string;
  }[];
  chart: { name: string; appointments: number }[];
}

const cards = [
  { key: "totalPatients", label: "Total Patients", icon: Users, accent: "border-blue-500", iconBg: "bg-blue-500" },
  { key: "totalDoctors", label: "Total Doctors", icon: Stethoscope, accent: "border-indigo-500", iconBg: "bg-indigo-500" },
  { key: "todaysAppointments", label: "Today's Appointments", icon: CalendarDays, accent: "border-amber-500", iconBg: "bg-amber-500" },
  { key: "totalRevenue", label: "Total Revenue", icon: DollarSign, accent: "border-green-500", iconBg: "bg-green-500", money: true },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/stats");
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setStats(json.data);
      } catch {
        toast.error("Could not load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spinner label="Loading dashboard..." />;
  if (!stats) return <EmptyState message="No data available." />;

  const quick = [
    { label: "Pending Appointments", value: stats.pendingAppointments, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Unpaid Bills", value: stats.unpaidBills, icon: Receipt, color: "text-red-600 bg-red-50" },
    { label: "Departments", value: stats.totalDepartments, icon: Building2, color: "text-purple-600 bg-purple-50" },
    { label: "Low Stock Medicines", value: stats.lowStock, icon: AlertTriangle, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 p-6 text-white shadow-lg">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Welcome to MediCare ERP 🏥</h2>
          <p className="mt-1 max-w-lg text-sm text-brand-100">
            Aap ke hospital ka pura overview — patients, doctors, appointments,
            pharmacy aur revenue, sab ek jagah.
          </p>
          <Link
            href="/reports"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25"
          >
            View Full Reports <ArrowRight size={15} />
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-white/5" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          const value = stats[c.key as keyof Stats] as number;
          return (
            <div
              key={c.key}
              className={`card flex items-center gap-4 border-l-4 p-5 ${c.accent}`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${c.iconBg}`}
              >
                <Icon size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{c.label}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {"money" in c && c.money
                    ? `$${value.toLocaleString()}`
                    : value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quick.map((q) => {
          const Icon = q.icon;
          return (
            <div key={q.label} className="card flex items-center gap-3 p-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${q.color}`}
              >
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{q.value}</p>
                <p className="text-xs text-slate-500">{q.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Chart */}
        <div className="card p-5 lg:col-span-3">
          <h2 className="mb-4 font-semibold text-slate-900">
            Appointments by Status
          </h2>
          <AppointmentsChart data={stats.chart} />
        </div>

        {/* Recent patients */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent Patients</h2>
            <Link
              href="/patients"
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {stats.recentPatients.length === 0 ? (
            <EmptyState message="No patients yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.recentPatients.map((p) => (
                <li
                  key={p._id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {p.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {p.disease} · {p.gender}, {p.age}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">{p.phone}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
