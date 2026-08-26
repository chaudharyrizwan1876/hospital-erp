"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Printer, Activity } from "lucide-react";
import { Spinner, StatusBadge } from "@/components/ui";

interface SaleItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}
interface RelatedSale {
  _id: string;
  items: SaleItem[];
  total: number;
  date: string;
}
interface BillDetail {
  _id: string;
  patientName: string;
  patient?: { name: string; age?: number; gender?: string; phone?: string } | null;
  appointment?: {
    date: string;
    time: string;
    doctor?: { name: string; specialization?: string } | null;
  } | null;
  amount: number;
  status: string;
  createdAt: string;
  relatedSales: RelatedSale[];
}

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/billing/${params.id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setBill(json.data);
      } catch (e: any) {
        toast.error(e.message || "Could not load invoice");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) return <Spinner label="Loading invoice..." />;
  if (!bill) return null;

  const pharmacyTotal = bill.relatedSales.reduce((s, x) => s + x.total, 0);
  const grandTotal = bill.amount + pharmacyTotal;
  const invoiceNo = bill._id.slice(-8).toUpperCase();
  const issueDate = bill.appointment?.date || bill.createdAt.slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <button
          onClick={() => router.push("/billing")}
          className="btn-ghost"
        >
          <ArrowLeft size={16} />
          Back to Billing
        </button>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={16} />
          Download / Print PDF
        </button>
      </div>

      <div id="printable" className="card mx-auto max-w-2xl p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">MediCare</p>
              <p className="text-xs text-slate-500">Hospital ERP</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">INVOICE</p>
            <p className="text-xs text-slate-500">#{invoiceNo}</p>
            <p className="text-xs text-slate-500">{issueDate}</p>
          </div>
        </div>

        {/* Patient / doctor info */}
        <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Billed To
            </p>
            <p className="font-medium text-slate-900">{bill.patientName}</p>
            {bill.patient?.age !== undefined && (
              <p className="text-slate-500">
                {bill.patient?.gender}, {bill.patient?.age} yrs
              </p>
            )}
            {bill.patient?.phone && (
              <p className="text-slate-500">{bill.patient.phone}</p>
            )}
          </div>
          {bill.appointment && (
            <div className="text-right">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Consulting Doctor
              </p>
              <p className="font-medium text-slate-900">
                {bill.appointment.doctor?.name ?? "—"}
              </p>
              <p className="text-slate-500">
                {bill.appointment.doctor?.specialization}
              </p>
              <p className="text-slate-500">
                {bill.appointment.date} at {bill.appointment.time}
              </p>
            </div>
          )}
        </div>

        {/* Line items */}
        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="py-2">Description</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2 text-slate-700">
                {bill.appointment?.doctor?.name
                  ? `Consultation with ${bill.appointment.doctor.name}`
                  : "Consultation Fee"}
              </td>
              <td className="py-2 text-center text-slate-500">1</td>
              <td className="py-2 text-right font-medium text-slate-900">
                ${bill.amount.toLocaleString()}
              </td>
            </tr>
            {bill.relatedSales.flatMap((sale) =>
              sale.items.map((item, i) => (
                <tr key={`${sale._id}-${i}`}>
                  <td className="py-2 text-slate-700">{item.name} (Pharmacy)</td>
                  <td className="py-2 text-center text-slate-500">
                    {item.quantity}
                  </td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    ${item.subtotal.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Total */}
        <div className="mb-6 flex justify-end">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Consultation</span>
              <span>${bill.amount.toLocaleString()}</span>
            </div>
            {pharmacyTotal > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Pharmacy</span>
                <span>${pharmacyTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>${grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-400">
            Thank you for choosing MediCare Hospital.
          </p>
          <StatusBadge status={bill.status} />
        </div>
      </div>
    </div>
  );
}
