"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Plus, UserPlus, Pencil } from "lucide-react";
import { Spinner, EmptyState, SearchInput, Modal } from "@/components/ui";

interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: string;
  disease: string;
  phone: string;
}

const empty = { name: "", age: "", gender: "Male", disease: "", phone: "" };

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Patient | null>(null);
  const [role, setRole] = useState("Admin");

  async function load() {
    try {
      setLoading(true);
      const [res, me] = await Promise.all([
        fetch("/api/patients").then((r) => r.json()),
        fetch("/api/auth/me").then((r) => r.json()),
      ]);
      if (!res.success) throw new Error(res.message);
      setPatients(res.data);
      setRole(me.data?.role || "Admin");
    } catch {
      toast.error("Could not load patients");
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
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Patient added");
      setForm(empty);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to add patient");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await fetch(`/api/patients/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Patient updated");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this patient?")) return;
    try {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Patient deleted");
      setPatients((p) => p.filter((x) => x._id !== id));
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const filtered = useMemo(
    () =>
      patients.filter((p) =>
        `${p.name} ${p.disease} ${p.phone}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [patients, query]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Add form — Doctors are view-only, registration is done by reception */}
      {!isDoctor && (
      <div className="lg:col-span-1">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-brand-600" />
            <h2 className="font-semibold text-slate-900">Add Patient</h2>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Age</label>
                <input
                  type="number"
                  className="input"
                  required
                  min={0}
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Gender</label>
                <select
                  className="input"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Disease</label>
              <input
                className="input"
                required
                value={form.disease}
                onChange={(e) => setForm({ ...form, disease: e.target.value })}
              />
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
            <button className="btn-primary w-full justify-center" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Add Patient"}
            </button>
          </form>
        </div>
      </div>
      )}

      {/* List */}
      <div className={isDoctor ? "lg:col-span-3" : "lg:col-span-2"}>
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              {isDoctor ? "My Patients" : "All Patients"}
            </h2>
            <div className="flex items-center gap-3">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search patients..."
              />
              <span className="badge bg-brand-50 text-brand-700">
                {filtered.length}
              </span>
            </div>
          </div>
          {loading ? (
            <Spinner label="Loading patients..." />
          ) : filtered.length === 0 ? (
            <EmptyState message="No patients found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Name</th>
                    <th className="th">Age</th>
                    <th className="th">Gender</th>
                    <th className="th">Disease</th>
                    <th className="th">Phone</th>
                    {!isDoctor && <th className="th text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="td font-medium text-slate-900">{p.name}</td>
                      <td className="td">{p.age}</td>
                      <td className="td">{p.gender}</td>
                      <td className="td">{p.disease}</td>
                      <td className="td">{p.phone}</td>
                      {!isDoctor && (
                      <td className="td text-right">
                        <button
                          onClick={() => setEditing(p)}
                          className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={!!editing} title="Edit Patient" onClose={() => setEditing(null)}>
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
                <label className="label">Age</label>
                <input
                  type="number"
                  className="input"
                  min={0}
                  value={editing.age}
                  onChange={(e) =>
                    setEditing({ ...editing, age: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="label">Gender</label>
                <select
                  className="input"
                  value={editing.gender}
                  onChange={(e) =>
                    setEditing({ ...editing, gender: e.target.value })
                  }
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Disease</label>
              <input
                className="input"
                value={editing.disease}
                onChange={(e) =>
                  setEditing({ ...editing, disease: e.target.value })
                }
              />
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
