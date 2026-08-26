"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Receipt,
  Edit,
  X,
} from "lucide-react";
import { Spinner, EmptyState, SearchInput } from "@/components/ui";

interface Medicine {
  _id: string;
  name: string;
  price: number;
  stock: number;
}
interface PatientRef {
  _id: string;
  name: string;
}
interface CartItem {
  medicine: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}
interface SaleItem {
  medicine: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}
interface Sale {
  _id: string;
  patientName: string;
  items: SaleItem[];
  total: number;
  date: string;
}

interface EditingSaleItem extends SaleItem {
  originalQuantity: number;
}

export default function SalesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [patients, setPatients] = useState<PatientRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState("");
  const [walkIn, setWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selMed, setSelMed] = useState("");
  const [qty, setQty] = useState("1");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editingSale, setEditingSale] =
    useState<Sale | null>(null);

  const [editItems, setEditItems] =
    useState<EditingSaleItem[]>([]);

  const [updatingSale, setUpdatingSale] =
    useState(false);

  async function load() {
    try {
      setLoading(true);
      const [m, s, p] = await Promise.all([
        fetch("/api/medicines").then((r) => r.json()),
        fetch("/api/sales").then((r) => r.json()),
        fetch("/api/patients").then((r) => r.json()),
      ]);
      setMedicines(m.data || []);
      setSales(s.data || []);
      setPatients(p.data || []);
    } catch {
      toast.error("Could not load pharmacy data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function addToCart() {
    const med = medicines.find((m) => m._id === selMed);
    if (!med) {
      toast.error("Select a medicine");
      return;
    }
    const q = Number(qty);
    if (!q || q < 1) {
      toast.error("Enter a valid quantity");
      return;
    }
    const already = cart.find((c) => c.medicine === med._id);
    const inCart = already ? already.quantity : 0;
    if (q + inCart > med.stock) {
      toast.error(`Only ${med.stock} in stock for ${med.name}`);
      return;
    }
    if (already) {
      setCart((c) =>
        c.map((x) =>
          x.medicine === med._id ? { ...x, quantity: x.quantity + q } : x
        )
      );
    } else {
      setCart((c) => [
        ...c,
        {
          medicine: med._id,
          name: med.name,
          price: med.price,
          quantity: q,
          stock: med.stock,
        },
      ]);
    }
    setSelMed("");
    setQty("1");
  }

  function removeFromCart(id: string) {
    setCart((c) => c.filter((x) => x.medicine !== id));
  }

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  async function completeSale() {
    if (!walkIn && !patients.find((p) => p._id === patientId)) {
      toast.error("Select a patient");
      return;
    }
    if (walkIn && !walkInName.trim()) {
      toast.error("Enter the walk-in customer's name");
      return;
    }
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setSaving(true);
    try {
      let salePatientId = patientId;
      let salePatientName = patients.find((p) => p._id === patientId)?.name || "";

      if (walkIn) {
        // No patient record on file — create a lightweight one so this
        // purchase still shows up on billing/ledger like any patient's.
        const created = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: walkInName.trim(),
            age: 0,
            gender: "Other",
            disease: "Walk-in (Pharmacy)",
            phone: walkInPhone.trim() || "N/A",
          }),
        }).then((r) => r.json());
        if (!created.success) throw new Error(created.message);
        salePatientId = created.data._id;
        salePatientName = created.data.name;
      }

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: salePatientName,
          patient: salePatientId,
          items: cart.map((c) => ({
            medicine: c.medicine,
            quantity: c.quantity,
          })),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Sale completed — stock updated");
      setPatientId("");
      setWalkIn(false);
      setWalkInName("");
      setWalkInPhone("");
      setCart([]);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to complete sale");
    } finally {
      setSaving(false);
    }
  }

  function startEditSale(sale: Sale) {
    setEditingSale(sale);

    setEditItems(
      sale.items.map((item) => ({
        ...item,
        originalQuantity: item.quantity,
      }))
    );
  }

  function cancelEditSale() {
    setEditingSale(null);
    setEditItems([]);
  }

  function updateEditQuantity(
    medicineId: string,
    quantity: number
  ) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      return;
    }

    setEditItems((items) =>
      items.map((item) =>
        item.medicine === medicineId
          ? {
            ...item,
            quantity,
            subtotal: item.price * quantity,
          }
          : item
      )
    );
  }

  const editTotal = editItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  async function saveSaleEdit() {
    if (!editingSale) return;

    setUpdatingSale(true);

    try {
      const res = await fetch("/api/sales", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saleId: editingSale._id,
          items: editItems.map((item) => ({
            medicine: item.medicine,
            quantity: item.quantity,
          })),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(
          json.message ||
          "Failed to update sale"
        );
      }

      toast.success(
        "Sale updated and return recorded"
      );

      setEditingSale(null);
      setEditItems([]);

      await load();
    } catch (error: any) {
      toast.error(
        error.message ||
        "Failed to update sale"
      );
    } finally {
      setUpdatingSale(false);
    }
  }

  const filtered = useMemo(
    () =>
      sales.filter((s) =>
        s.patientName.toLowerCase().includes(query.toLowerCase())
      ),
    [sales, query]
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayRevenue = sales
    .filter((s) => s.date === today)
    .reduce((s, x) => s + x.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Total Sales</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {sales.length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Today's Revenue</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            ${todayRevenue.toLocaleString()}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            ${sales.reduce((s, x) => s + x.total, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* New sale */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShoppingCart size={18} className="text-brand-600" />
              <h2 className="font-semibold text-slate-900">New Sale</h2>
            </div>

            <label className="label">Patient</label>
            {!walkIn ? (
              <>
                <select
                  className="input mb-2"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setWalkIn(true);
                    setPatientId("");
                  }}
                  className="mb-4 text-xs font-medium text-brand-600 hover:underline"
                >
                  Not registered? Add a walk-in customer
                </button>
              </>
            ) : (
              <div className="mb-4 space-y-2 rounded-lg border border-dashed border-slate-300 p-3">
                <input
                  className="input"
                  placeholder="Customer name"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Phone (optional)"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setWalkIn(false);
                    setWalkInName("");
                    setWalkInPhone("");
                  }}
                  className="text-xs font-medium text-slate-500 hover:underline"
                >
                  Select a registered patient instead
                </button>
              </div>
            )}

            <label className="label">Add Medicine</label>
            <div className="mb-3 flex gap-2">
              <select
                className="input"
                value={selMed}
                onChange={(e) => setSelMed(e.target.value)}
              >
                <option value="">Select medicine</option>
                {medicines.map((m) => (
                  <option key={m._id} value={m._id} disabled={m.stock <= 0}>
                    {m.name} (${m.price}) — {m.stock} in stock
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                className="input w-20"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              <button
                type="button"
                onClick={addToCart}
                className="btn-primary px-3"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Cart */}
            {cart.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                Cart is empty
              </p>
            ) : (
              <div className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {cart.map((c) => (
                  <div
                    key={c.medicine}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {c.quantity} × ${c.price} = ${c.quantity * c.price}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(c.medicine)}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-500">Total</span>
              <span className="text-lg font-bold text-slate-900">
                ${total.toLocaleString()}
              </span>
            </div>

            <button
              onClick={completeSale}
              disabled={saving}
              className="btn-primary w-full justify-center"
            >
              <Receipt size={16} />
              {saving ? "Processing..." : "Complete Sale"}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Sales History</h2>
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search by patient..."
              />
            </div>
            {loading ? (
              <Spinner label="Loading sales..." />
            ) : filtered.length === 0 ? (
              <EmptyState message="No sales yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <div key={s._id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">
                        {s.patientName}
                      </p>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-600">
                          ${s.total.toLocaleString()}
                        </span>

                        <button
                          type="button"
                          onClick={() => startEditSale(s)}
                          className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"
                          title="Edit sale / process return"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="mb-1 text-xs text-slate-400">{s.date}</p>
                    <div className="flex flex-wrap gap-1">
                      {s.items.map((it, i) => (
                        <span
                          key={i}
                          className="badge bg-slate-100 text-slate-600"
                        >
                          {it.name} ×{it.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {editingSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Edit Sale / Return
                  </h2>

                  <p className="text-sm text-slate-500">
                    {editingSale.patientName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cancelEditSale}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
                {editItems.map((item) => (
                  <div
                    key={item.medicine}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          Original: {item.originalQuantity} × $
                          {item.price}
                        </p>
                      </div>

                      <input
                        type="number"
                        min={1}
                        max={item.originalQuantity}
                        value={item.quantity}
                        onChange={(e) =>
                          updateEditQuantity(
                            item.medicine,
                            Number(e.target.value)
                          )
                        }
                        className="input w-24"
                      />
                    </div>

                    <p className="mt-2 text-right text-sm font-semibold text-slate-700">
                      $
                      {(
                        item.price * item.quantity
                      ).toLocaleString()}
                    </p>

                    {item.quantity <
                      item.originalQuantity && (
                        <p className="mt-1 text-right text-xs text-red-600">
                          Return:{" "}
                          {item.originalQuantity -
                            item.quantity}{" "}
                          unit(s) — Refund $
                          {(
                            item.price *
                            (item.originalQuantity -
                              item.quantity)
                          ).toLocaleString()}
                        </p>
                      )}
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 px-5 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Updated Total
                  </span>

                  <span className="text-xl font-bold text-slate-900">
                    ${editTotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cancelEditSale}
                    disabled={updatingSale}
                    className="btn-secondary flex-1 justify-center"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={saveSaleEdit}
                    disabled={updatingSale}
                    className="btn-primary flex-1 justify-center"
                  >
                    {updatingSale
                      ? "Updating..."
                      : "Update Sale"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
