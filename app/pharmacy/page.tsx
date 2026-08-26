"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pill, Plus, Trash2, Pencil, AlertTriangle } from "lucide-react";
import { Spinner, EmptyState, SearchInput, Modal } from "@/components/ui";

interface Medicine {
  _id: string;
  name: string;
  category?: string;
  stock: number;
  price: number;
  expiry?: string;
}

const empty = { name: "", category: "Tablet", stock: "", price: "", expiry: "" };

export default function PharmacyPage() {
  const [items, setItems] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Medicine | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/medicines");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setItems(json.data);
    } catch {
      toast.error("Could not load medicines");
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
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Medicine added");
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
      const res = await fetch(`/api/medicines/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name,
          category: editing.category,
          stock: editing.stock,
          price: editing.price,
          expiry: editing.expiry,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Medicine updated");
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this medicine?")) return;
    try {
      const res = await fetch(`/api/medicines/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Medicine deleted");
      setItems((x) => x.filter((m) => m._id !== id));
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const filtered = useMemo(
    () =>
      items.filter((m) =>
        `${m.name} ${m.category ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [items, query]
  );

  const lowStock = items.filter((m) => m.stock <= 10).length;

  return (
    <div className="space-y-6">
      {lowStock > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={16} />
          <span>
            <b>{lowStock}</b> medicine(s) are low on stock (≤ 10 units).
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Pill size={18} className="text-brand-600" />
              <h2 className="font-semibold text-slate-900">Add Medicine</h2>
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
                <label className="label">Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option>Tablet</option>
                  <option>Syrup</option>
                  <option>Injection</option>
                  <option>Capsule</option>
                  <option>Ointment</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Stock</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Price ($)</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Expiry Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                />
              </div>
              <button
                className="btn-primary w-full justify-center"
                disabled={saving}
              >
                <Plus size={16} />
                {saving ? "Saving..." : "Add Medicine"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Medicine Stock</h2>
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search medicines..."
              />
            </div>
            {loading ? (
              <Spinner label="Loading medicines..." />
            ) : filtered.length === 0 ? (
              <EmptyState message="No medicines found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="th">Name</th>
                      <th className="th">Category</th>
                      <th className="th">Stock</th>
                      <th className="th">Price</th>
                      <th className="th">Expiry</th>
                      <th className="th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50">
                        <td className="td font-medium text-slate-900">
                          {m.name}
                        </td>
                        <td className="td">{m.category}</td>
                        <td className="td">
                          <span
                            className={`badge ${
                              m.stock <= 10
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {m.stock} units
                          </span>
                        </td>
                        <td className="td">${m.price}</td>
                        <td className="td text-slate-500">{m.expiry || "—"}</td>
                        <td className="td text-right">
                          <button
                            onClick={() => setEditing(m)}
                            className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(m._id)}
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
        title="Edit Medicine"
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
              <label className="label">Category</label>
              <select
                className="input"
                value={editing.category ?? "Tablet"}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
              >
                <option>Tablet</option>
                <option>Syrup</option>
                <option>Injection</option>
                <option>Capsule</option>
                <option>Ointment</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Stock</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={editing.stock}
                  onChange={(e) =>
                    setEditing({ ...editing, stock: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="label">Price ($)</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={editing.price}
                  onChange={(e) =>
                    setEditing({ ...editing, price: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input
                type="date"
                className="input"
                value={editing.expiry ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, expiry: e.target.value })
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
