"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plane, Plus, Trash2, Check, X } from "lucide-react";
import { Spinner, EmptyState, SearchInput, StatusBadge } from "@/components/ui";

interface Emp {
  _id: string;
  name: string;
  designation?: string;
}
interface Leave {
  _id: string;
  employee: Emp | null;
  type: string;
  fromDate: string;
  toDate: string;
  reason?: string;
  status: string;
}

const empty = {
  employee: "",
  type: "Casual",
  fromDate: "",
  toDate: "",
  reason: "",
};

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    try {
      setLoading(true);
      const [l, e] = await Promise.all([
        fetch("/api/leaves").then((r) => r.json()),
        fetch("/api/employees").then((r) => r.json()),
      ]);
      setLeaves(l.data || []);
      setEmployees(e.data || []);
    } catch {
      toast.error("Could not load leaves");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Leave request submitted");
      setForm(empty);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(`Leave ${status.toLowerCase()}`);
      setLeaves((list) =>
        list.map((x) => (x._id === id ? { ...x, status } : x))
      );
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this leave request?")) return;
    try {
      const res = await fetch(`/api/leaves/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Deleted");
      setLeaves((x) => x.filter((l) => l._id !== id));
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const filtered = useMemo(
    () =>
      leaves.filter((l) =>
        `${l.employee?.name ?? ""} ${l.type} ${l.status}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [leaves, query]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Plane size={18} className="text-brand-600" />
            <h2 className="font-semibold text-slate-900">Apply for Leave</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Employee</label>
              <select
                className="input"
                required
                value={form.employee}
                onChange={(e) => setForm({ ...form, employee: e.target.value })}
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
              <label className="label">Leave Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option>Casual</option>
                <option>Sick</option>
                <option>Annual</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">From</label>
                <input
                  type="date"
                  className="input"
                  required
                  value={form.fromDate}
                  onChange={(e) =>
                    setForm({ ...form, fromDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">To</label>
                <input
                  type="date"
                  className="input"
                  required
                  value={form.toDate}
                  onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Reason</label>
              <textarea
                className="input"
                rows={2}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <button className="btn-primary w-full justify-center" disabled={saving}>
              <Plus size={16} />
              {saving ? "Submitting..." : "Submit Request"}
            </button>
            {employees.length === 0 && (
              <p className="text-xs text-amber-600">Add employees first.</p>
            )}
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Leave Requests</h2>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search leaves..."
            />
          </div>
          {loading ? (
            <Spinner label="Loading leaves..." />
          ) : filtered.length === 0 ? (
            <EmptyState message="No leave requests found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Employee</th>
                    <th className="th">Type</th>
                    <th className="th">From</th>
                    <th className="th">To</th>
                    <th className="th">Status</th>
                    <th className="th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50">
                      <td className="td font-medium text-slate-900">
                        {l.employee?.name ?? "—"}
                      </td>
                      <td className="td">{l.type}</td>
                      <td className="td">{l.fromDate}</td>
                      <td className="td">{l.toDate}</td>
                      <td className="td">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="td text-right">
                        {l.status === "Pending" && (
                          <>
                            <button
                              onClick={() => setStatus(l._id, "Approved")}
                              className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                              title="Approve"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={() => setStatus(l._id, "Rejected")}
                              className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                              title="Reject"
                            >
                              <X size={15} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(l._id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          title="Delete"
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
  );
}
