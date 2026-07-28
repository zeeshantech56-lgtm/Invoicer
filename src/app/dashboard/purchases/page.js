"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import PurchaseInvoiceForm from "@/components/PurchaseInvoiceForm";
import { getPurchaseInvoices } from "@/lib/purchases";

function PageShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-500/40">
                <span className="text-white font-black text-sm">I</span>
              </div>
              <span className="font-bold text-slate-900 text-base tracking-tight hidden sm:block">Invoicer</span>
            </Link>
            <div className="flex-1" />
            <Link href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 px-4 py-2 rounded-xl transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}

function PurchasesContent() {
  const { user } = useAuth();
  const [shopProfile, setShopProfile] = useState(null);
  const [invoices, setInvoices]       = useState([]);
  const [loading, setLoading]         = useState(true);

  const fetchPurchases = async () => {
    if (!user) return;
    try { const data = await getPurchaseInvoices(user.uid); setInvoices(data); }
    catch (err) { console.error(err); }
  };

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setShopProfile(snap.data());
        await fetchPurchases();
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [user]);

  const fmt = ts => !ts?.toDate ? "" : ts.toDate().toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading purchases…</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell title="Purchase Invoices" subtitle="Record stock purchases from suppliers. Stock quantities update automatically.">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* ── Form ── */}
        <div className="lg:col-span-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">New Purchase Entry</h2>
            <p className="text-xs text-slate-500 mt-0.5">Record a purchase from a supplier.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <PurchaseInvoiceForm shopProfile={shopProfile} onPurchaseSaved={fetchPurchases} />
          </div>
        </div>

        {/* ── History ── */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Purchase History</h2>
              <p className="text-xs text-slate-500 mt-0.5">{invoices.length} purchase record{invoices.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl mb-3">🏭</div>
                <p className="font-bold text-slate-700 text-sm">No purchases recorded yet</p>
                <p className="text-slate-400 text-xs mt-1">Use the form to record your first stock purchase.</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {["Supplier","Items","Total Amount","Date"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-900">{inv.supplierName}</p>
                          </td>
                          <td className="px-5 py-3.5 max-w-[200px]">
                            <p className="text-slate-500 text-xs truncate">
                              {(inv.products || []).map(p => `${p.qty}× ${p.name}`).join(", ")}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-900">₹{Number(inv.grandTotal || 0).toFixed(2)}</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">{fmt(inv.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {invoices.map(inv => (
                    <div key={inv.id} className="px-4 py-4">
                      <div className="flex items-start justify-between mb-1.5">
                        <p className="font-bold text-slate-900 text-sm">{inv.supplierName}</p>
                        <p className="font-extrabold text-slate-900">₹{Number(inv.grandTotal || 0).toFixed(2)}</p>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{(inv.products||[]).map(p=>`${p.qty}× ${p.name}`).join(", ")}</p>
                      <p className="text-xs text-slate-400 mt-1.5">{fmt(inv.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default function PurchasesPage() {
  return <ProtectedRoute><PurchasesContent /></ProtectedRoute>;
}
