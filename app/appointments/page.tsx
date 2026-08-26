"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarPlus, Plus } from "lucide-react";
import { Spinner, EmptyState, StatusBadge } from "@/components/ui";

interface Ref {
  _id: string;
  name: string;
  specialization?: string;
}
interface Appointment {
  _id: string;
  patient: Ref | null;
  doctor: Ref | null;
  date: string;
  time: string;
  status: string;
}

const empty = { patient: "", doctor: "", date: "", time: "", status: "Pending" };

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Ref[]>([]);
  const [doctors, setDoctors] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState("Admin");

  async function load() {
    try {
      setLoading(true);
      const [a, p, d, me] = await Promise.all([
        fetch("/api/appointments").then((r) => r.json()),
        fetch("/api/patients").then((r) => r.json()),
        fetch("/api/doctors").then((r) => r.json()),
        fetch("/api/auth/me").then((r) => r.json()),
      ]);
      setAppointments(a.data || []);
      setPatients(p.data || []);
      setDoctors(d.data || []);
      setRole(me.data?.role || "Admin");
    } catch {
      toast.error("Could not load appointments");
    } finally {
      setLoading(false);
    }
  }

  const isDoctor = role === "Doctor";

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Appointment created");
      setForm(empty);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to create appointment");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Status updated");
      setAppointments((list) =>
        list.map((x) => (x._id === id ? { ...x, status } : x))
      );
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Create form — Doctors don't book their own appointments */}
      {!isDoctor && (
      <div className="lg:col-span-1">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarPlus size={18} className="text-brand-600" />
            <h2 className="font-semibold text-slate-900">New Appointment</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Patient</label>
              <select
                className="input"
                required
                value={form.patient}
                onChange={(e) => setForm({ ...form, patient: e.target.value })}
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Doctor</label>
              <select
                className="input"
                required
                value={form.doctor}
                onChange={(e) => setForm({ ...form, doctor: e.target.value })}
              >
                <option value="">Select doctor</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                    {d.specialization ? ` — ${d.specialization}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Time</label>
                <input
                  type="time"
                  className="input"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Pending</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </div>
            <button className="btn-primary w-full justify-center" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Create Appointment"}
            </button>
            {patients.length === 0 || doctors.length === 0 ? (
              <p className="text-xs text-amber-600">
                Add at least one patient and one doctor first.
              </p>
            ) : null}
          </form>
        </div>
      </div>
      )}

      {/* List */}
      <div className={isDoctor ? "lg:col-span-3" : "lg:col-span-2"}>
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              {isDoctor ? "My Appointments" : "All Appointments"}
            </h2>
            <span className="badge bg-brand-50 text-brand-700">
              {appointments.length} total
            </span>
          </div>
          {loading ? (
            <Spinner label="Loading appointments..." />
          ) : appointments.length === 0 ? (
            <EmptyState message="No appointments yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Patient</th>
                    <th className="th">Doctor</th>
                    <th className="th">Date</th>
                    <th className="th">Time</th>
                    <th className="th">Status</th>
                    <th className="th text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50">
                      <td className="td font-medium text-slate-900">
                        {a.patient?.name ?? "—"}
                      </td>
                      <td className="td">{a.doctor?.name ?? "—"}</td>
                      <td className="td">{a.date}</td>
                      <td className="td">{a.time}</td>
                      <td className="td">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="td text-right">
                        <select
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-brand-500"
                          value={a.status}
                          onChange={(e) => updateStatus(a._id, e.target.value)}
                        >
                          <option>Pending</option>
                          <option>Completed</option>
                          <option>Cancelled</option>
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
    </div>
  );
}
