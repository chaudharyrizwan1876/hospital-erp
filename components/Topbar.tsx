"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/patients": "Patients",
  "/doctors": "Doctors",
  "/departments": "Departments",
  "/appointments": "Appointments",
  "/records": "Medical Records",
  "/pharmacy": "Pharmacy",
  "/billing": "Billing",
  "/ledger": "Patient Ledger",
  "/reports": "Reports & Analytics",
  "/pharmacy/sales": "Pharmacy Sales",
  "/pharmacy/returns": "Pharmacy Returns",
  "/employees": "Employees",
  "/attendance": "Attendance",
  "/leaves": "Leave Management",
  "/payroll": "Payroll",
};

export default function Topbar() {
  const pathname = usePathname();
  // Prefer an exact match, then fall back to the longest prefix match
  const exact = titles[pathname];
  const prefixKey = Object.keys(titles)
    .filter((k) => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  const title = exact ?? (prefixKey ? titles[prefixKey] : "Dashboard");

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">
          Welcome back, Dr. Admin 👋
        </p>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">Admin User</p>
          <p className="text-xs text-slate-500">Administrator</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-semibold text-white">
          A
        </div>
      </div>
    </header>
  );
}
