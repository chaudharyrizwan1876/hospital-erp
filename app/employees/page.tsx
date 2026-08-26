"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { UserCog, Plus, Trash2, Pencil } from "lucide-react";
import { Spinner, EmptyState, SearchInput, Modal, StatusBadge } from "@/components/ui";

interface Employee {
  _id: string;
  name: string;
  designation: string;
  department?: string;
  joiningDate?: string;
  salary: number;
  phone?: string;
  email?: string;
  status: string;
}

const empty = {
  name: "",
  designation: "Nurse",
  department: "",
  joiningDate: "",
  salary: "",
  phone: "",
  email: "",
  status: "Active",
};

const DESIGNATIONS = [
  "Nurse",
  "Receptionist",
  "Ward Boy",
  "Lab Technician",
  "Pharmacist",
  "Accountant",
  "Admin Staff",
  "Cleaner",
];

export default function EmployeesPage() {
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Employee | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/employees");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setItems(json.data);
    } catch {
      toast.error("Could not load employees");
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
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Employee added");
      setForm(empty);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await fetch(`/api/employees/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Employee updated");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this employee?")) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Employee deleted");
      setItems((x) => x.filter((e) => e._id !== id));
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const filtered = useMemo(
    () =>
      items.filter((e) =>
        `${e.name} ${e.designation} ${e.department ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [items, query]
  );

  const totalPayroll = items
    .filter((e) => e.status === "Active")
    .reduce((s, e) => s + e.salary, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Total Employees</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {items.length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {items.filter((e) => e.status === "Active").length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Monthly Salary (Active)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            ${totalPayroll.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserCog size={18} className="text-brand-600" />
              <h2 className="font-semibold text-slate-900">Add Employee</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Designation</label>
                <select
                  className="input"
                  value={form.designation}
                  onChange={(e) =>
                    setForm({ ...form, designation: e.target.value })
                  }
                >
                  {DESIGNATIONS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Department</label>
                <input
                  className="input"
                  placeholder="e.g. Cardiology"
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Salary ($)</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    required
                    value={form.salary}
                    onChange={(e) =>
                      setForm({ ...form, salary: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">Joining Date</label>
                  <input
                    type="date"
                    className="input"
                    value={form.joiningDate}
                    onChange={(e) =>
                      setForm({ ...form, joiningDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <button
                className="btn-primary w-full justify-center"
                disabled={saving}
              >
                <Plus size={16} />
                {saving ? "Saving..." : "Add Employee"}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">All Employees</h2>
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search employees..."
              />
            </div>
            {loading ? (
              <Spinner label="Loading employees..." />
            ) : filtered.length === 0 ? (
              <EmptyState message="No employees found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="th">Name</th>
                      <th className="th">Designation</th>
                      <th className="th">Department</th>
                      <th className="th">Salary</th>
                      <th className="th">Status</th>
                      <th className="th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((e) => (
                      <tr key={e._id} className="hover:bg-slate-50">
                        <td className="td font-medium text-slate-900">
                          {e.name}
                        </td>
                        <td className="td">{e.designation}</td>
                        <td className="td">{e.department || "—"}</td>
                        <td className="td">${e.salary.toLocaleString()}</td>
                        <td className="td">
                          <StatusBadge status={e.status} />
                        </td>
                        <td className="td text-right">
                          <button
                            onClick={() => setEditing(e)}
                            className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(e._id)}
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

      <Modal
        open={!!editing}
        title="Edit Employee"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <form onSubmit={handleUpdate} className="space-y-3">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                required
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Designation</label>
                <select
                  className="input"
                  value={editing.designation}
                  onChange={(e) =>
                    setEditing({ ...editing, designation: e.target.value })
                  }
                >
                  {DESIGNATIONS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value })
                  }
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Department</label>
              <input
                className="input"
                value={editing.department ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, department: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Salary ($)</label>
              <input
                type="number"
                min={0}
                className="input"
                value={editing.salary}
                onChange={(e) =>
                  setEditing({ ...editing, salary: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={editing.phone ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  value={editing.email ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="btn-primary">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
