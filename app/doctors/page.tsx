"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Plus, Stethoscope, Mail, Phone, Pencil, Building2 } from "lucide-react";
import { Spinner, EmptyState, SearchInput, Modal } from "@/components/ui";

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  department?: string;
  phone: string;
  email: string;
}

const empty = {
  name: "",
  specialization: "",
  department: "",
  phone: "",
  email: "",
  username: "",
  password: "",
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Doctor | null>(null);

  async function load() {
    try {
      setLoading(true);
      const [d, dep] = await Promise.all([
        fetch("/api/doctors").then((r) => r.json()),
        fetch("/api/departments").then((r) => r.json()),
      ]);
      setDoctors(d.data || []);
      setDepartments(dep.data || []);
    } catch {
      toast.error("Could not load doctors");
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
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Doctor added");
      setForm(empty);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to add doctor");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await fetch(`/api/doctors/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Doctor updated");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this doctor?")) return;
    try {
      const res = await fetch(`/api/doctors/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Doctor deleted");
      setDoctors((d) => d.filter((x) => x._id !== id));
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const filtered = useMemo(
    () =>
      doctors.filter((d) =>
        `${d.name} ${d.specialization} ${d.department ?? ""} ${d.email}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [doctors, query]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Add form */}
      <div className="lg:col-span-1">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Stethoscope size={18} className="text-brand-600" />
            <h2 className="font-semibold text-slate-900">Add Doctor</h2>
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
              <label className="label">Specialization</label>
              <input
                className="input"
                required
                placeholder="e.g. Cardiologist"
                value={form.specialization}
                onChange={(e) =>
                  setForm({ ...form, specialization: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Department</label>
              <select
                className="input"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              >
                <option value="">— None —</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 p-3">
              <p className="mb-2 text-xs font-medium text-slate-500">
                Login access (optional) — lets this doctor sign in and see
                only their own patients and appointments.
              </p>
              <div className="space-y-2">
                <input
                  className="input"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
                <input
                  type="password"
                  className="input"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
            </div>

            <button className="btn-primary w-full justify-center" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Add Doctor"}
            </button>
          </form>
        </div>
      </div>

      {/* Cards grid */}
      <div className="lg:col-span-2">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">All Doctors</h2>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search doctors..."
            />
          </div>
          {loading ? (
            <Spinner label="Loading doctors..." />
          ) : filtered.length === 0 ? (
            <EmptyState message="No doctors found." />
          ) : (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              {filtered.map((d) => (
                <div
                  key={d._id}
                  className="group relative rounded-xl border border-slate-200 p-4 transition hover:border-brand-300 hover:shadow-sm"
                >
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => setEditing(d)}
                      className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(d._id)}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                      {d.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{d.name}</p>
                      <p className="text-xs text-brand-600">
                        {d.specialization}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-slate-500">
                    {d.department && (
                      <p className="flex items-center gap-2">
                        <Building2 size={13} /> {d.department}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Phone size={13} /> {d.phone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail size={13} /> {d.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={!!editing} title="Edit Doctor" onClose={() => setEditing(null)}>
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
            <div>
              <label className="label">Specialization</label>
              <input
                className="input"
                value={editing.specialization}
                onChange={(e) =>
                  setEditing({ ...editing, specialization: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Department</label>
              <select
                className="input"
                value={editing.department ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, department: e.target.value })
                }
              >
                <option value="">— None —</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={editing.phone}
                onChange={(e) =>
                  setEditing({ ...editing, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={editing.email}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
              />
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
