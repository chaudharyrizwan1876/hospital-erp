"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { isRouteAllowed } from "@/lib/roles";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  Receipt,
  Activity,
  Building2,
  Pill,
  FileText,
  BookOpen,
  BarChart3,
  LogOut,
  ShoppingCart,
  Undo2,
  UserCog,
  CalendarCheck,
  Plane,
  Wallet,
} from "lucide-react";

const sections = [
  {
    title: null,
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Clinical",
    items: [
      { href: "/patients", label: "Patients", icon: Users },
      { href: "/doctors", label: "Doctors", icon: Stethoscope },
      { href: "/departments", label: "Departments", icon: Building2 },
      { href: "/appointments", label: "Appointments", icon: CalendarDays },
      { href: "/records", label: "Medical Records", icon: FileText },
    ],
  },
  {
    title: "Pharmacy",
    items: [
      { href: "/pharmacy", label: "Medicines", icon: Pill },
      { href: "/pharmacy/sales", label: "Sales", icon: ShoppingCart },
      { href: "/pharmacy/returns", label: "Returns", icon: Undo2 },
    ],
  },
  {
    title: "Human Resources",
    items: [
      { href: "/employees", label: "Employees", icon: UserCog },
      { href: "/attendance", label: "Attendance", icon: CalendarCheck },
      { href: "/leaves", label: "Leave", icon: Plane },
      { href: "/payroll", label: "Payroll", icon: Wallet },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/billing", label: "Billing", icon: Receipt },
      { href: "/ledger", label: "Patient Ledger", icon: BookOpen },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
];

function readRoleCookie(): string {
  if (typeof document === "undefined") return "Admin";
  const match = document.cookie.match(/(?:^|; )erp_role=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "Admin";
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("Admin");

  useEffect(() => {
    setRole(readRoleCookie());
  }, [pathname]);

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isRouteAllowed(role, item.href)),
    }))
    .filter((section) => section.items.length > 0);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  }

  return (
    <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Activity size={20} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900">
            MediCare
          </p>
          <p className="text-xs text-slate-500">Hospital ERP</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {visibleSections.map((section, i) => (
          <div key={i}>
            {section.title && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/" ? pathname === "/" : pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <p className="mb-2 px-3 text-xs font-medium text-slate-500">
          Signed in as <span className="text-slate-700">{role}</span>
        </p>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
        >
          <LogOut size={18} />
          Logout
        </button>
        <p className="mt-3 px-3 text-xs text-slate-400">© 2026 MediCare ERP</p>
      </div>
    </aside>
  );
}
