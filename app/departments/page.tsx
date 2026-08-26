"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Building2, Plus, Trash2, Pencil } from "lucide-react";
import { Spinner, EmptyState, SearchInput, Modal } from "@/components/ui";

interface Department {
  _id: string;
  name: string;
  head?: string;
  description?: string;
}

const empty = { name: "", head: "", description: "" };

export default function DepartmentsPage() {
  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Department | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/departments");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setItems(json.data);
    } catch {
      toast.error("Could not load departments");
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
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Department added");
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
      const res = await fetch(`/api/departments/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name,
          head: editing.head,
          description: editing.description,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Department updated");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this department?")) return;
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Department deleted");
      setItems((x) => x.filter((d) => d._id !== id));
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const filtered = useMemo(
    () =>
      items.filter((d) =>
        `${d.name} ${d.head ?? ""}`.toLowerCase().includes(query.toLowerCase())
      ),
    [items, query]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-brand-600" />
            <h2 className="font-semibold text-slate-900">Add Department</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                required
                placeholder="e.g. Cardiology"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Head of Department</label>
              <input
                className="input"
                value={form.head}
                onChange={(e) => setForm({ ...form, head: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <button className="btn-primary w-full justify-center" disabled={saving}>
              <Plus size={16} />
              {saving ? "Saving..." : "Add Department"}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">All Departments</h2>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search departments..."
            />
          </div>
          {loading ? (
            <Spinner label="Loading departments..." />
          ) : filtered.length === 0 ? (
            <EmptyState message="No departments found." />
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
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                      <Building2 size={16} />
                    </div>
                    <p className="font-semibold text-slate-900">{d.name}</p>
                  </div>
                  {d.head && (
                    <p className="text-sm text-slate-600">
                      <span className="text-slate-400">Head:</span> {d.head}
                    </p>
                  )}
                  {d.description && (
                    <p className="mt-1 text-xs text-slate-500">
                      {d.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        title="Edit Department"
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
            <div>
              <label className="label">Head of Department</label>
              <input
                className="input"
                value={editing.head ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, head: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={3}
                value={editing.description ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
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
