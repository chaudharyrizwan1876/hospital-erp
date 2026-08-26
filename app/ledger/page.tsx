"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BookOpen, Printer, Activity } from "lucide-react";
import { Spinner, EmptyState, StatusBadge } from "@/components/ui";

interface PatientRef {
  _id: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
}
interface Entry {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  status: string;
}
interface LedgerData {
  patient: PatientRef;
  entries: Entry[];
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
}
interface SummaryRow {
  patient: PatientRef;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  entryCount: number;
}

export default function LedgerPage() {
  const [mode, setMode] = useState<"single" | "all">("single");
  const [patients, setPatients] = useState<PatientRef[]>([]);
  const [patientId, setPatientId] = useState("");
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);

  const [allFilter, setAllFilter] = useState<"all" | "appointments">("all");
  const [summary, setSummary] = useState<SummaryRow[] | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then((j) => setPatients(j.data || []))
      .catch(() => toast.error("Could not load patients"));
  }, []);

  async function loadLedger(id: string) {
    setPatientId(id);
    setLedger(null);
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ledger?patientId=${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setLedger(json.data);
    } catch (e: any) {
      toast.error(e.message || "Could not load ledger");
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary(filter: "all" | "appointments") {
    setAllFilter(filter);
    setSummaryLoading(true);
    try {
      const res = await fetch(`/api/ledger/all?filter=${filter}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setSummary(json.data);
    } catch (e: any) {
      toast.error(e.message || "Could not load report");
    } finally {
      setSummaryLoading(false);
    }
  }

  function switchMode(next: "single" | "all") {
    setMode(next);
    if (next === "all" && !summary) loadSummary(allFilter);
  }

  return (
    <div className="space-y-6">
      <div className="no-print card p-5">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen size={18} className="text-brand-600" />
          <h2 className="font-semibold text-slate-900">Patient Ledger</h2>
        </div>

        <div className="mb-4 inline-flex rounded-lg border border-slate-200 p-1">
          <button
            onClick={() => switchMode("single")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              mode === "single"
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Single Patient
          </button>
          <button
            onClick={() => switchMode("all")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              mode === "all"
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            All Patients
          </button>
        </div>

        {mode === "single" ? (
          <select
            className="input max-w-sm"
            value={patientId}
            onChange={(e) => loadLedger(e.target.value)}
          >
            <option value="">Select a patient...</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <select
            className="input max-w-sm"
            value={allFilter}
            onChange={(e) => loadSummary(e.target.value as "all" | "appointments")}
          >
            <option value="all">All Patients</option>
            <option value="appointments">Only Patients With Appointments</option>
          </select>
        )}
      </div>

      {mode === "single" && loading && <Spinner label="Loading ledger..." />}

      {mode === "single" && !loading && patientId && !ledger && (
        <EmptyState message="No records found for this patient." />
      )}

      {mode === "single" && ledger && (
        <>
          <div className="no-print flex justify-end">
            <button onClick={() => window.print()} className="btn-primary">
              <Printer size={16} />
              Download / Print PDF
            </button>
          </div>

          <div id="printable" className="card mx-auto max-w-2xl p-8">
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
                <p className="text-lg font-bold text-slate-900">
                  PATIENT LEDGER
                </p>
                <p className="text-xs text-slate-500">
                  {new Date().toISOString().slice(0, 10)}
                </p>
              </div>
            </div>

            <div className="mb-6 text-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Patient
              </p>
              <p className="font-medium text-slate-900">
                {ledger.patient.name}
              </p>
              {ledger.patient.age !== undefined && (
                <p className="text-slate-500">
                  {ledger.patient.gender}, {ledger.patient.age} yrs
                </p>
              )}
              {ledger.patient.phone && (
                <p className="text-slate-500">{ledger.patient.phone}</p>
              )}
            </div>

            <table className="mb-6 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="py-2">Date</th>
                  <th className="py-2">Description</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      No billing history yet.
                    </td>
                  </tr>
                ) : (
                  ledger.entries.map((e) => (
                    <tr key={e.id}>
                      <td className="py-2 text-slate-500">{e.date}</td>
                      <td className="py-2 text-slate-700">{e.description}</td>
                      <td className="py-2">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="py-2 text-right font-medium text-slate-900">
                        ${e.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-56 space-y-1 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Total Billed</span>
                  <span>${ledger.totalBilled.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Total Paid</span>
                  <span>${ledger.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold text-slate-900">
                  <span>Outstanding</span>
                  <span>${ledger.outstanding.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {mode === "all" && summaryLoading && <Spinner label="Building report..." />}

      {mode === "all" && !summaryLoading && summary && (
        <>
          <div className="no-print flex justify-end">
            <button onClick={() => window.print()} className="btn-primary">
              <Printer size={16} />
              Download / Print PDF
            </button>
          </div>

          <div id="printable" className="card mx-auto max-w-3xl p-8">
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
                <p className="text-lg font-bold text-slate-900">
                  PATIENT LEDGER SUMMARY
                </p>
                <p className="text-xs text-slate-500">
                  {allFilter === "appointments"
                    ? "Patients with appointments"
                    : "All patients"}{" "}
                  · {new Date().toISOString().slice(0, 10)}
                </p>
              </div>
            </div>

            {summary.length === 0 ? (
              <EmptyState message="No patients match this filter." />
            ) : (
              <>
                <table className="mb-6 w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="py-2">Patient</th>
                      <th className="py-2 text-right">Total Billed</th>
                      <th className="py-2 text-right">Total Paid</th>
                      <th className="py-2 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.map((row) => (
                      <tr key={row.patient._id}>
                        <td className="py-2 text-slate-700">{row.patient.name}</td>
                        <td className="py-2 text-right text-slate-900">
                          ${row.totalBilled.toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-green-600">
                          ${row.totalPaid.toLocaleString()}
                        </td>
                        <td className="py-2 text-right font-medium text-slate-900">
                          ${row.outstanding.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>Total Billed ({summary.length} patients)</span>
                      <span>
                        $
                        {summary
                          .reduce((s, r) => s + r.totalBilled, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Total Paid</span>
                      <span>
                        $
                        {summary
                          .reduce((s, r) => s + r.totalPaid, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold text-slate-900">
                      <span>Outstanding</span>
                      <span>
                        $
                        {summary
                          .reduce((s, r) => s + r.outstanding, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
