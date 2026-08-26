"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { ReceiptText, Plus, FileText } from "lucide-react";
import { Spinner, EmptyState, StatusBadge } from "@/components/ui";

interface Bill {
  _id: string;
  patientName: string;
  amount: number;
  pharmacyAmount: number;
  total: number;
  status: string;
  appointment?: { _id: string; date: string; time: string } | null;
  createdAt?: string;
}
interface Appointment {
  _id: string;
  patient: { _id: string; name: string } | null;
  doctor: { _id: string; name: string } | null;
  date: string;
  time: string;
  status: string;
}
interface Sale {
  _id: string;
  patient: string | null;
  date: string;
  total: number;
  bill: string | null;
}
interface PatientRef {
  _id: string;
  name: string;
}

const empty = {
  appointmentId: "",
  patientId: "",
  patientName: "",
  amount: "",
  status: "Unpaid",
};
const today = new Date().toISOString().slice(0, 10);

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [patients, setPatients] = useState<PatientRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [b, a, s, p] = await Promise.all([
        fetch("/api/billing").then((r) => r.json()),
        fetch("/api/appointments").then((r) => r.json()),
        fetch("/api/sales").then((r) => r.json()),
        fetch("/api/patients").then((r) => r.json()),
      ]);
      if (!b.success) throw new Error(b.message);
      setBills(b.data);
      setAppointments(a.data || []);
      setSales(s.data || []);
      setPatients(p.data || []);
    } catch {
      toast.error("Could not load bills");
    } finally {
      setLoading(false);
    }
  }

  // Completed appointments that haven't been billed yet
  const billedAppointmentIds = new Set(
    bills.filter((b) => b.appointment).map((b) => b.appointment!._id)
  );
  const billableAppointments = appointments.filter(
    (a) => a.status === "Completed" && !billedAppointmentIds.has(a._id)
  );

  // Medicines this patient bought that day, excluding anything already
  // claimed by another bill — shown as a preview so whoever's creating
  // the bill knows it'll be added on top of the amount they type in.
  // For an appointment bill that's the appointment's date; for a manual
  // bill against a chosen patient it's today.
  const selectedAppointment = appointments.find((a) => a._id === form.appointmentId);
  const pharmacyDate = selectedAppointment ? selectedAppointment.date : today;
  const pharmacyPatientId = selectedAppointment
    ? selectedAppointment.patient?._id
    : form.patientId;
  const pharmacyPreview = pharmacyPatientId
    ? sales
        .filter(
          (s) => !s.bill && s.patient === pharmacyPatientId && s.date === pharmacyDate
        )
        .reduce((sum, s) => sum + s.total, 0)
    : 0;
  const formTotal = (Number(form.amount) || 0) + pharmacyPreview;

  function pickAppointment(id: string) {
    const appt = appointments.find((a) => a._id === id);
    setForm({
      ...form,
      appointmentId: id,
      patientId: appt?.patient?._id || "",
      patientName: appt?.patient?.name || "",
    });
  }

  function pickPatient(id: string) {
    const patient = patients.find((p) => p._id === id);
    setForm({ ...form, patientId: id, patientName: patient?.name || "" });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Bill created");
      setForm(empty);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to create bill");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/billing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(`Marked ${status}`);
      setBills((list) =>
        list.map((b) => (b._id === id ? { ...b, status } : b))
      );
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  }

  const total = bills.reduce((s, b) => s + b.total, 0);
  const paid = bills.filter((b) => b.status === "Paid").reduce((s, b) => s + b.total, 0);
  const unpaid = total - paid;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Total Billed</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            ${total.toLocaleString()}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Collected (Paid)</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            ${paid.toLocaleString()}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Outstanding (Unpaid)</p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            ${unpaid.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Create form */}
        <div className="lg:col-span-1">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <ReceiptText size={18} className="text-brand-600" />
              <h2 className="font-semibold text-slate-900">Create Bill</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Bill a Completed Appointment</label>
                <select
                  className="input"
                  value={form.appointmentId}
                  onChange={(e) => pickAppointment(e.target.value)}
                >
                  <option value="">Manual / walk-in bill</option>
                  {billableAppointments.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.patient?.name ?? "Unknown patient"} ·{" "}
                      {a.doctor?.name ?? "Unknown doctor"} · {a.date} {a.time}
                    </option>
                  ))}
                </select>
                {billableAppointments.length === 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    No completed appointments waiting to be billed.
                  </p>
                )}
              </div>
              <div>
                <label className="label">Patient</label>
                <select
                  className="input"
                  required
                  disabled={!!form.appointmentId}
                  value={form.patientId}
                  onChange={(e) => pickPatient(e.target.value)}
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
                <label className="label">
                  {form.appointmentId ? "Consultation Fee ($)" : "Amount ($)"}
                </label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              {pharmacyPreview > 0 && (
                <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                  <div className="flex justify-between">
                    <span>
                      Pharmacy (medicines bought{" "}
                      {form.appointmentId ? "that day" : "today"})
                    </span>
                    <span>${pharmacyPreview.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-brand-100 pt-1 font-semibold">
                    <span>Bill Total</span>
                    <span>${formTotal.toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-brand-500">
                    Added automatically. No need to include it above.
                  </p>
                </div>
              )}
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Unpaid</option>
                  <option>Paid</option>
                </select>
              </div>
              <button
                className="btn-primary w-full justify-center"
                disabled={saving}
              >
                <Plus size={16} />
                {saving ? "Saving..." : "Create Bill"}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">All Bills</h2>
              <span className="badge bg-brand-50 text-brand-700">
                {bills.length} total
              </span>
            </div>
            {loading ? (
              <Spinner label="Loading bills..." />
            ) : bills.length === 0 ? (
              <EmptyState message="No bills yet. Create one from the form." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="th">Patient</th>
                      <th className="th">Amount</th>
                      <th className="th">Status</th>
                      <th className="th">Date</th>
                      <th className="th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bills.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50">
                        <td className="td font-medium text-slate-900">
                          {b.patientName}
                          {b.appointment && (
                            <span className="ml-2 badge bg-slate-100 text-slate-500">
                              {b.appointment.date} {b.appointment.time}
                            </span>
                          )}
                        </td>
                        <td className="td font-semibold">
                          ${b.total.toLocaleString()}
                          {b.pharmacyAmount > 0 && (
                            <p className="mt-0.5 text-xs font-normal text-slate-400">
                              ${b.amount.toLocaleString()} consult + $
                              {b.pharmacyAmount.toLocaleString()} pharmacy
                            </p>
                          )}
                        </td>
                        <td className="td">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="td text-slate-500">
                          {b.createdAt
                            ? new Date(b.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="td text-right">
                          <Link
                            href={`/billing/${b._id}`}
                            className="mr-1 inline-flex rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            title="View invoice"
                          >
                            <FileText size={15} />
                          </Link>
                          <button
                            onClick={() =>
                              setStatus(
                                b._id,
                                b.status === "Paid" ? "Unpaid" : "Paid"
                              )
                            }
                            className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                          >
                            Mark {b.status === "Paid" ? "Unpaid" : "Paid"}
                          </button>
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
    </div>
  );
}
