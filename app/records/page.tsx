"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Spinner, EmptyState, SearchInput } from "@/components/ui";

interface Ref {
  _id: string;
  name: string;
  specialization?: string;
}
interface Record {
  _id: string;
  patient: Ref | null;
  doctor: Ref | null;
  diagnosis: string;
  prescription?: string;
  notes?: string;
  date: string;
}

const empty = {
  patient: "",
  doctor: "",
  diagnosis: "",
  prescription: "",
  notes: "",
  date: "",
};

export default function RecordsPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [patients, setPatients] = useState<Ref[]>([]);
  const [doctors, setDoctors] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Admin");

  async function load() {
    try {
      setLoading(true);
      const [r, p, d, me] = await Promise.all([
        fetch("/api/records").then((x) => x.json()),
        fetch("/api/patients").then((x) => x.json()),
        fetch("/api/doctors").then((x) => x.json()),
        fetch("/api/auth/me").then((x) => x.json()),
      ]);
      setRecords(r.data || []);
      setPatients(p.data || []);
      setDoctors(d.data || []);
      setRole(me.data?.role || "Admin");
      if (me.data?.doctorId) {
        setForm((f) => ({ ...f, doctor: me.data.doctorId }));
      }
    } catch {
      toast.error("Could not load records");
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
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Record added");
      setForm(empty);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to add record");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this record?")) return;
    try {
      const res = await fetch(`/api/records/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Record deleted");
      setRecords((x) => x.filter((r) => r._id !== id));
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const filtered = useMemo(
    () =>
      records.filter((r) =>
        `${r.patient?.name ?? ""} ${r.doctor?.name ?? ""} ${r.diagnosis}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [records, query]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={18} className="text-brand-600" />
            <h2 className="font-semibold text-slate-900">New Record</h2>
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
            {!isDoctor && (
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
                  </option>
                ))}
              </select>
            </div>
            )}
            <div>
              <label className="label">Diagnosis</label>
              <input
                className="input"
                required
                value={form.diagnosis}
                onChange={(e) =>
                  setForm({ ...form, diagnosis: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Prescription</label>
              <textarea
                className="input"
                rows={2}
                value={form.prescription}
                onChange={(e) =>
                  setForm({ ...form, prescription: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
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
            <button className="btn-primary w-full justify-center" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Add Record"}
            </button>
            {patients.length === 0 || doctors.length === 0 ? (
              <p className="text-xs text-amber-600">
                Add at least one patient and one doctor first.
              </p>
            ) : null}
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Medical Records</h2>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search records..."
            />
          </div>
          {loading ? (
            <Spinner label="Loading records..." />
          ) : filtered.length === 0 ? (
            <EmptyState message="No records found." />
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <div key={r._id} className="group p-5 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {r.patient?.name ?? "—"}{" "}
                        <span className="text-sm font-normal text-slate-400">
                          · {r.date}
                        </span>
                      </p>
                      <p className="text-sm text-brand-600">
                        {r.diagnosis}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="rounded-lg p-2 text-red-600 opacity-0 transition hover:bg-red-50 group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <p>
                      <span className="text-slate-400">Doctor:</span>{" "}
                      {r.doctor?.name ?? "—"}
                    </p>
                    {r.prescription && (
                      <p>
                        <span className="text-slate-400">Prescription:</span>{" "}
                        {r.prescription}
                      </p>
                    )}
                    {r.notes && (
                      <p>
                        <span className="text-slate-400">Notes:</span> {r.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
