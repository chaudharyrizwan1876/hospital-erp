"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarCheck } from "lucide-react";
import { Spinner, EmptyState, StatusBadge } from "@/components/ui";

interface Employee {
  _id: string;
  name: string;
  designation: string;
  status: string;
}
interface AttRecord {
  employee: { _id: string } | string;
  status: string;
}

const STATUSES = ["Present", "Absent", "Leave", "Half Day"];

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
    n.getDate()
  ).padStart(2, "0")}`;
}

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [date, setDate] = useState(todayStr());
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [empRes, attRes] = await Promise.all([
        fetch("/api/employees").then((r) => r.json()),
        fetch(`/api/attendance?date=${date}`).then((r) => r.json()),
      ]);
      const active = (empRes.data || []).filter(
        (e: Employee) => e.status === "Active"
      );
      setEmployees(active);
      const map: Record<string, string> = {};
      (attRes.data || []).forEach((a: AttRecord) => {
        const id =
          typeof a.employee === "string" ? a.employee : a.employee?._id;
        if (id) map[id] = a.status;
      });
      setMarks(map);
    } catch {
      toast.error("Could not load attendance");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function mark(employee: string, status: string) {
    setMarks((m) => ({ ...m, [employee]: status }));
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee, date, status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Attendance saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  }

  const counts = STATUSES.reduce(
    (acc, s) => ({
      ...acc,
      [s]: Object.values(marks).filter((v) => v === s).length,
    }),
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-2">
          <CalendarCheck size={18} className="text-brand-600" />
          <h2 className="font-semibold text-slate-900">Daily Attendance</h2>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Date</label>
          <input
            type="date"
            className="input w-auto"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATUSES.map((s) => (
          <div key={s} className="card p-4">
            <p className="text-sm text-slate-500">{s}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts[s] || 0}
            </p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Mark Attendance — {date}
          </h2>
        </div>
        {loading ? (
          <Spinner label="Loading employees..." />
        ) : employees.length === 0 ? (
          <EmptyState message="No active employees. Add employees first." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Employee</th>
                  <th className="th">Designation</th>
                  <th className="th">Current</th>
                  <th className="th text-right">Set Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50">
                    <td className="td font-medium text-slate-900">{e.name}</td>
                    <td className="td">{e.designation}</td>
                    <td className="td">
                      {marks[e._id] ? (
                        <StatusBadge status={marks[e._id]} />
                      ) : (
                        <span className="text-xs text-slate-400">
                          Not marked
                        </span>
                      )}
                    </td>
                    <td className="td text-right">
                      <select
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-brand-500"
                        value={marks[e._id] || ""}
                        onChange={(ev) => mark(e._id, ev.target.value)}
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
