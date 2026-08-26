"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Undo2, Plus } from "lucide-react";
import { Spinner, EmptyState, SearchInput } from "@/components/ui";

interface Medicine {
  _id: string;
  name: string;
  price: number;
  stock: number;
}
interface ReturnRow {
  _id: string;
  name: string;
  patientName?: string;
  quantity: number;
  refund: number;
  reason?: string;
  date: string;
}

const empty = { medicine: "", patientName: "", quantity: "1", reason: "" };

export default function ReturnsPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    try {
      setLoading(true);
      const [m, r] = await Promise.all([
        fetch("/api/medicines").then((x) => x.json()),
        fetch("/api/returns").then((x) => x.json()),
      ]);
      setMedicines(m.data || []);
      setReturns(r.data || []);
    } catch {
      toast.error("Could not load returns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selMed = medicines.find((m) => m._id === form.medicine);
  const refundPreview = selMed ? selMed.price * (Number(form.quantity) || 0) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Return recorded — stock increased");
      setForm(empty);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to record return");
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(
    () =>
      returns.filter((r) =>
        `${r.name} ${r.patientName ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [returns, query]
  );

  const totalRefund = returns.reduce((s, r) => s + r.refund, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Total Returns</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {returns.length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Total Refunded</p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            ${totalRefund.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Undo2 size={18} className="text-brand-600" />
              <h2 className="font-semibold text-slate-900">Return Medicine</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Medicine</label>
                <select
                  className="input"
                  required
                  value={form.medicine}
                  onChange={(e) =>
                    setForm({ ...form, medicine: e.target.value })
                  }
                >
                  <option value="">Select medicine</option>
                  {medicines.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} (${m.price})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Patient Name</label>
                <input
                  className="input"
                  placeholder="Optional"
                  value={form.patientName}
                  onChange={(e) =>
                    setForm({ ...form, patientName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  required
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Reason</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="e.g. Wrong medicine, expired, unused"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>
              <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                Refund: <b>${refundPreview.toLocaleString()}</b>
              </div>
              <button
                className="btn-primary w-full justify-center"
                disabled={saving}
              >
                <Plus size={16} />
                {saving ? "Processing..." : "Record Return"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Returns History</h2>
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search returns..."
              />
            </div>
            {loading ? (
              <Spinner label="Loading returns..." />
            ) : filtered.length === 0 ? (
              <EmptyState message="No returns yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="th">Medicine</th>
                      <th className="th">Patient</th>
                      <th className="th">Qty</th>
                      <th className="th">Refund</th>
                      <th className="th">Date</th>
                      <th className="th">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50">
                        <td className="td font-medium text-slate-900">
                          {r.name}
                        </td>
                        <td className="td">{r.patientName || "—"}</td>
                        <td className="td">{r.quantity}</td>
                        <td className="td font-semibold text-red-600">
                          ${r.refund.toLocaleString()}
                        </td>
                        <td className="td text-slate-500">{r.date}</td>
                        <td className="td text-slate-500">{r.reason || "—"}</td>
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
