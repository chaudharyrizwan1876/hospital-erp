"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Wallet, Plus, Trash2 } from "lucide-react";
import { Spinner, EmptyState, SearchInput, StatusBadge } from "@/components/ui";

interface Emp {
  _id: string;
  name: string;
  salary?: number;
  designation?: string;
}
interface Pay {
  _id: string;
  employee: Emp | null;
  month: string;
  basic: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: string;
}

function thisMonth() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

const empty = {
  employee: "",
  month: thisMonth(),
  basic: "",
  allowances: "",
  deductions: "",
};

export default function PayrollPage() {
  const [rows, setRows] = useState<Pay[]>([]);
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    try {
      setLoading(true);
      const [p, e] = await Promise.all([
        fetch("/api/payroll").then((r) => r.json()),
        fetch("/api/employees").then((r) => r.json()),
      ]);
      setRows(p.data || []);
      setEmployees(e.data || []);
    } catch {
      toast.error("Could not load payroll");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function pickEmployee(id: string) {
    const emp = employees.find((e) => e._id === id);
    setForm({
      ...form,
      employee: id,
      basic: emp?.salary != null ? String(emp.salary) : form.basic,
    });
  }

  const netPreview =
    (Number(form.basic) || 0) +
    (Number(form.allowances) || 0) -
    (Number(form.deductions) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Payroll generated");
      setForm(empty);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(`Marked ${status}`);
      setRows((list) => list.map((x) => (x._id === id ? { ...x, status } : x)));
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this payslip?")) return;
    try {
      const res = await fetch(`/api/payroll/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Deleted");
      setRows((x) => x.filter((r) => r._id !== id));
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        `${r.employee?.name ?? ""} ${r.month} ${r.status}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [rows, query]
  );

  const paid = rows.filter((r) => r.status === "Paid").reduce((s, r) => s + r.netPay, 0);
  const unpaid = rows.filter((r) => r.status === "Unpaid").reduce((s, r) => s + r.netPay, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Payslips</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{rows.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Paid</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            ${paid.toLocaleString()}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Unpaid</p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            ${unpaid.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Wallet size={18} className="text-brand-600" />
              <h2 className="font-semibold text-slate-900">Generate Payslip</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Employee</label>
                <select
                  className="input"
                  required
                  value={form.employee}
                  onChange={(e) => pickEmployee(e.target.value)}
                >
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Month</label>
                <input
                  type="month"
                  className="input"
                  required
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Basic Salary ($)</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  required
                  value={form.basic}
                  onChange={(e) => setForm({ ...form, basic: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Allowances</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={form.allowances}
                    onChange={(e) =>
                      setForm({ ...form, allowances: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">Deductions</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={form.deductions}
                    onChange={(e) =>
                      setForm({ ...form, deductions: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                Net Pay: <b>${netPreview.toLocaleString()}</b>
              </div>
              <button
                className="btn-primary w-full justify-center"
                disabled={saving}
              >
                <Plus size={16} />
                {saving ? "Generating..." : "Generate Payslip"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Payslips</h2>
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search payroll..."
              />
            </div>
            {loading ? (
              <Spinner label="Loading payroll..." />
            ) : filtered.length === 0 ? (
              <EmptyState message="No payslips found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="th">Employee</th>
                      <th className="th">Month</th>
                      <th className="th">Basic</th>
                      <th className="th">Net Pay</th>
                      <th className="th">Status</th>
                      <th className="th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50">
                        <td className="td font-medium text-slate-900">
                          {r.employee?.name ?? "—"}
                        </td>
                        <td className="td">{r.month}</td>
                        <td className="td">${r.basic.toLocaleString()}</td>
                        <td className="td font-semibold">
                          ${r.netPay.toLocaleString()}
                        </td>
                        <td className="td">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="td text-right">
                          <button
                            onClick={() =>
                              setStatus(
                                r._id,
                                r.status === "Paid" ? "Unpaid" : "Paid"
                              )
                            }
                            className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                          >
                            Mark {r.status === "Paid" ? "Unpaid" : "Paid"}
                          </button>
                          <button
                            onClick={() => handleDelete(r._id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
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
