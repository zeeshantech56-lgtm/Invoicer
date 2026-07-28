"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, getDoc, updateDoc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { INDIAN_STATES } from "@/lib/constants";

const inputCls = "w-full h-11 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-3.5 text-sm font-medium transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none hover:border-slate-300";
const selectCls = inputCls + " appearance-none";

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
        {label} {hint && <span className="font-normal text-slate-400 normal-case tracking-normal ml-1">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [shopName, setShopName]   = useState("");
  const [originalShopName, setOriginalShopName] = useState("");
  const [gstin, setGstin]         = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [stateCode, setStateCode] = useState("");

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setShopName(d.shopName || ""); setOriginalShopName(d.shopName || "");
        setGstin(d.gstin || ""); setBusinessAddress(d.businessAddress || ""); setStateCode(d.stateCode || "");
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const handleSave = async e => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setSaved(false);
    try {
      const stateName = INDIAN_STATES.find(s => s.code === stateCode)?.name || "";
      if (gstin) {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(gstin)) alert("Warning: GSTIN format looks invalid. Saving anyway — please verify.");
      }
      const newClean = shopName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      const oldClean = originalShopName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (newClean !== oldClean) {
        if (!newClean) throw new Error("Please enter a valid shop name.");
        await runTransaction(db, async tx => {
          const ref = doc(db, "shopNames", newClean);
          const snap = await tx.get(ref);
          if (snap.exists() && snap.data().uid !== user.uid) throw new Error("This shop name is already taken. Please choose another.");
          if (oldClean) tx.delete(doc(db, "shopNames", oldClean));
          tx.set(ref, { uid: user.uid });
          tx.update(doc(db, "users", user.uid), { shopName, gstin, businessAddress, stateCode, stateName });
        });
        setOriginalShopName(shopName);
      } else {
        await updateDoc(doc(db, "users", user.uid), { shopName, gstin, businessAddress, stateCode, stateName });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { alert("Error saving settings: " + err.message); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* ── Header ── */}
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

      {/* ── Page header ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Shop Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Update your shop profile, GST details, and business address.</p>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ── Settings form ── */}
          <div className="lg:col-span-7">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">Shop Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">This information appears on your invoices.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
                <Field label="Shop Name">
                  <input type="text" required value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. Sharma Electronics" className={inputCls} />
                </Field>

                <Field label="GSTIN" hint="(Optional — leave blank to hide GST from invoices)">
                  <input type="text" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} placeholder="e.g. 27AAAAA0000A1Z5" className={inputCls + " uppercase"} />
                  <p className="text-xs text-slate-400 mt-1.5">If left blank, all GST fields will be hidden from your invoices.</p>
                </Field>

                <Field label="Business Address">
                  <textarea value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} rows={3}
                    placeholder="Full shop address for invoice headers"
                    className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-3.5 py-3 text-sm font-medium resize-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 hover:border-slate-300 transition-all" />
                </Field>

                <Field label="State" hint="(Required for GST calculation)">
                  <div className="relative">
                    <select value={stateCode} onChange={e => setStateCode(e.target.value)} required={!!gstin} className={selectCls}>
                      <option value="">Select your state…</option>
                      {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </Field>

                <div className="pt-2">
                  <button type="submit" disabled={saving}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50">
                    {saving ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                    ) : saved ? (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Saved Successfully!</>
                    ) : (
                      "Save Settings"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Info sidebar ── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">How your settings are used.</p>
            </div>

            {/* GSTIN info */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg shrink-0">📋</div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">GST Invoicing</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">When you add your GSTIN, invoices automatically calculate CGST, SGST, and IGST based on product rates and customer state.</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-lg shrink-0">🏪</div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Shop Name</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Your shop name appears on every invoice and WhatsApp message sent to customers. Keep it professional and recognizable.</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-lg shrink-0">📍</div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Business Address</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Your full address is printed on invoice headers. Required for B2B GST invoices and for professional look.</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
              <p className="text-xs font-bold text-indigo-700 mb-1">💡 Need help?</p>
              <p className="text-xs text-indigo-600 leading-relaxed">
                Contact support on WhatsApp at{" "}
                <a href="https://wa.me/919202216517" target="_blank" rel="noopener noreferrer" className="underline font-semibold">9202216517</a>
                {" "}— we typically respond within minutes.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return <ProtectedRoute><SettingsContent /></ProtectedRoute>;
}
