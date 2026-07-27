// src/components/InvoiceHistory.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { subscribeToShopInvoices, RETENTION_DAYS, buildWhatsAppUrl } from "@/lib/invoices";
import { db } from "@/lib/firebase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import ExportModal from "./ExportModal";

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, borderColor, iconBg, valueColor = "text-slate-900" }) {
  return (
    <div className={`stat-card bg-white rounded-2xl border-2 ${borderColor} p-5 flex flex-col gap-3 shadow-sm`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">{label}</p>
        <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center text-lg`}>{icon}</div>
      </div>
      <p className={`text-2xl font-extrabold ${valueColor} tracking-tight leading-none`}>{value}</p>
    </div>
  );
}

// ── Payment badge ─────────────────────────────────────────────────────────────
function PayBadge({ status, onClick }) {
  const map = {
    paid:    "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200",
    partial: "bg-amber-100  text-amber-700  border border-amber-200  hover:bg-amber-200",
    unpaid:  "bg-rose-100   text-rose-700   border border-rose-200   hover:bg-rose-200",
  };
  const s = status || "unpaid";
  return (
    <button onClick={onClick} className={`${map[s]} px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition whitespace-nowrap`}>
      {s}
    </button>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function Section({ label }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-xl text-sm">
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="font-bold text-slate-900">₹{Number(payload[0]?.value || 0).toFixed(2)}</p>
    </div>
  );
}

export default function InvoiceHistory() {
  const { user } = useAuth();
  const [invoices, setInvoices]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [chartFilter, setChartFilter]         = useState("7d");
  const [editingPayment, setEditingPayment]   = useState(null);
  const [paymentStatus, setPaymentStatus]     = useState("unpaid");
  const [amountPaid, setAmountPaid]           = useState("");
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    setError(null);
    const unsub = subscribeToShopInvoices(
      user.uid,
      d => { setInvoices(d); setLoading(false); setError(null); },
      err => { console.error(err); setError("Unable to load invoices."); setLoading(false); }
    );
    return () => unsub();
  }, [user]);

  const fmt = ts => !ts?.toDate ? "Just now" : ts.toDate().toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
  const fmtCSV = ts => { if (!ts?.toDate) return ""; const d = ts.toDate(); return `${String(d.getDate()).padStart(2,"0")}-${d.toLocaleString("en-US",{month:"short"})}-${d.getFullYear()}`; };

  const today = new Date(); today.setHours(0,0,0,0);
  const todaysInv   = invoices.filter(inv => { if (!inv.timestamp?.toDate) return true; return inv.timestamp.toDate() >= today; });
  const todayCount  = todaysInv.length;
  const todayTotal  = todaysInv.reduce((s,inv) => s + Number(inv.finalAmount ?? inv.total ?? inv.grandTotal ?? 0), 0);
  const todayCash   = todaysInv.reduce((s,inv) => s + Number(inv.cashAmount   || 0), 0);
  const todayOnline = todaysInv.reduce((s,inv) => s + Number(inv.onlineAmount || 0), 0);

  const applyDateFilter = (list, { rangeType, startDate, endDate }) => {
    const now = new Date(), sD = d => new Date(d.getFullYear(),d.getMonth(),d.getDate()), eD = d => new Date(d.getFullYear(),d.getMonth(),d.getDate(),23,59,59,999);
    let start = null, end = null;
    switch(rangeType) {
      case "today":      start=sD(now); end=eD(now); break;
      case "yesterday":  { const y=new Date(now); y.setDate(y.getDate()-1); start=sD(y); end=eD(y); break; }
      case "7d":         { const d=new Date(now); d.setDate(d.getDate()-6); start=sD(d); end=eD(now); break; }
      case "last_month": start=new Date(now.getFullYear(),now.getMonth()-1,1); end=new Date(now.getFullYear(),now.getMonth(),0,23,59,59,999); break;
      case "this_year":  start=new Date(now.getFullYear(),0,1); end=eD(now); break;
      case "lifetime":   start=new Date(0); end=eD(now); break;
      case "custom":     if(startDate) start=sD(new Date(startDate)); if(endDate) end=eD(new Date(endDate)); break;
    }
    return list.filter(inv => { if(!inv.timestamp?.toDate) return false; const d=inv.timestamp.toDate(); if(start&&d<start) return false; if(end&&d>end) return false; return true; });
  };

  const handleExportCSV = fp => {
    const fi = applyDateFilter(invoices, fp);
    if (!fi.length) { alert("No invoices found for selected range."); return; }
    const hdr = ["Invoice No","Date","Customer","Phone","Items","Grand Total","Discount","Final Amount","Cash Amount","Online Amount","Payment Mode","Status"];
    const rows = fi.map(inv => {
      const no=`INV${inv.id.slice(0,8).toUpperCase()}`, dt=fmtCSV(inv.timestamp), cu=inv.customerName||"", ph=inv.customerPhone||"";
      const it=(inv.products||[]).map(p=>`${p.qty}x ${p.name}`).join("; ");
      const gt=inv.grandTotal??inv.total??0, dc=inv.discountAmount??0, fa=inv.finalAmount??gt;
      const ca=Number(inv.cashAmount||0), oa=Number(inv.onlineAmount||0), md=inv.paymentMode||"Unknown", st=inv.paymentStatus||"unpaid";
      return [`"${no}"`,`"${dt}"`,`"${cu.replace(/"/g,'""')}"`,`"${ph}"`,`"${it.replace(/"/g,'""')}"`,gt,dc,fa,ca,oa,`"${md}"`,`"${st}"`].join(",");
    });
    const ts=fi.reduce((s,i)=>s+Number(i.finalAmount??i.total??i.grandTotal??0),0), tc=fi.reduce((s,i)=>s+Number(i.cashAmount||0),0), to=fi.reduce((s,i)=>s+Number(i.onlineAmount||0),0);
    const csv = "data:text/csv;charset=utf-8,"+[hdr.join(","),...rows,"","Report Summary",`Total Invoices,${fi.length}`,`Total Sales,₹${ts.toFixed(2)}`,`Cash,₹${tc.toFixed(2)}`,`Online,₹${to.toFixed(2)}`].join("\n");
    const a = document.createElement("a"); a.setAttribute("href",encodeURI(csv)); a.setAttribute("download",`invoices_${fp.rangeType}_${new Date().toISOString().split("T")[0]}.csv`); document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const resendWhatsApp = inv => {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const cf = localStorage.getItem("invoicer_custom_footer") || "";
    window.open(buildWhatsAppUrl({ phone:inv.customerPhone, shopName:inv.shopName||"My Shop", customerName:inv.customerName, products:inv.products||[], total:inv.finalAmount??inv.total??inv.grandTotal??0, invoiceId:inv.id, siteUrl, customFooter:cf, paymentStatus:inv.paymentStatus, amountPaid:inv.amountPaid }), "_blank");
  };

  const handleUpdatePayment = async e => {
    e.preventDefault(); if (!editingPayment) return; setUpdatingPayment(true);
    try {
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      await updateDoc(doc(db,"invoices",editingPayment.id), { paymentStatus, amountPaid: Number(amountPaid)||0, updatedAt: serverTimestamp() });
      setEditingPayment(null);
    } catch(err) { alert("Error: "+err.message); } finally { setUpdatingPayment(false); }
  };

  const openModal = inv => { setEditingPayment(inv); setPaymentStatus(inv.paymentStatus||"unpaid"); setAmountPaid(inv.amountPaid||0); };

  // ── Chart ─────────────────────────────────────────────────────────────────
  let chartData = [];
  if (chartFilter==="7d")  chartData = Array.from({length:7}).map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6)+i); d.setHours(0,0,0,0); return {date:d,key:d.getTime(),total:0,label:d.toLocaleDateString(undefined,{weekday:"short"})}; });
  if (chartFilter==="30d") chartData = Array.from({length:30}).map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(29)+i); d.setHours(0,0,0,0); return {date:d,key:d.getTime(),total:0,label:d.toLocaleDateString(undefined,{month:"short",day:"numeric"})}; });
  if (chartFilter==="6m")  chartData = Array.from({length:6}).map((_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-(5)+i); d.setDate(1); d.setHours(0,0,0,0); return {date:d,key:d.getTime(),total:0,label:d.toLocaleDateString(undefined,{month:"short"})}; });

  invoices.forEach(inv => {
    if (!inv.timestamp?.toDate) return;
    const id = inv.timestamp.toDate();
    if (chartFilter==="7d"||chartFilter==="30d") { const d=new Date(id); d.setHours(0,0,0,0); const m=chartData.find(c=>c.key===d.getTime()); if(m) m.total+=Number(inv.finalAmount??inv.total??inv.grandTotal??0); }
    else if (chartFilter==="6m") { const m=chartData.find(c=>c.date.getMonth()===id.getMonth()&&c.date.getFullYear()===id.getFullYear()); if(m) m.total+=Number(inv.finalAmount??inv.total??inv.grandTotal??0); }
  });

  const statusPills = [
    { val:"paid",    label:"Paid",    sel:"bg-emerald-600 border-emerald-600 text-white", unsel:"bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700" },
    { val:"partial", label:"Partial", sel:"bg-amber-500 border-amber-500 text-white",     unsel:"bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-700"   },
    { val:"unpaid",  label:"Unpaid",  sel:"bg-rose-600 border-rose-600 text-white",       unsel:"bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-700"     },
  ];

  return (
    <div className="space-y-5">

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Today's Bills"     value={todayCount}                          icon="🧾" borderColor="border-indigo-100" iconBg="bg-indigo-50"  valueColor="text-indigo-700" />
        <StatCard label="Today's Revenue"   value={`₹${todayTotal.toFixed(2)}`}         icon="💰" borderColor="border-emerald-100" iconBg="bg-emerald-50" valueColor="text-emerald-700" />
        <StatCard label="Cash Collected"    value={`₹${todayCash.toFixed(2)}`}          icon="💵" borderColor="border-amber-100"   iconBg="bg-amber-50"   valueColor="text-amber-700" />
        <StatCard label="Online Collected"  value={`₹${todayOnline.toFixed(2)}`}        icon="📲" borderColor="border-sky-100"     iconBg="bg-sky-50"     valueColor="text-sky-700" />
      </div>

      {/* ── Sales Chart ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sales Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Revenue by period</p>
          </div>
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {[{v:"7d",l:"7D"},{v:"30d",l:"30D"},{v:"6m",l:"6M"}].map(({v,l}) => (
              <button key={v} onClick={() => setChartFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                  ${chartFilter===v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize:11, fill:"#94A3B8", fontWeight:500 }} dy={6}
                interval={chartFilter==="30d" ? 4 : 0} angle={chartFilter==="30d" ? -35 : 0}
                textAnchor={chartFilter==="30d" ? "end" : "middle"} height={chartFilter==="30d" ? 40 : 22} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize:11, fill:"#94A3B8" }} tickFormatter={v => `₹${v}`} />
              <RechartsTooltip content={<ChartTooltip />} cursor={{ fill:"#F8FAFF", rx:6 }} />
              <Bar dataKey="total" fill="#6366F1" radius={[6,6,0,0]} barSize={chartFilter==="30d"?9:(chartFilter==="6m"?36:22)} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Transaction List ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Last {RETENTION_DAYS} days</p>
          </div>
          <button onClick={() => setShowExportModal(true)} disabled={!invoices.length}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-700
              bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300
              px-3.5 py-2 rounded-xl transition-all disabled:opacity-40">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading transactions…</p>
          </div>
        ) : error ? (
          <div className="m-4 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl mb-3">🧾</div>
            <p className="font-bold text-slate-700 text-sm">No invoices yet</p>
            <p className="text-slate-400 text-xs mt-1">Create your first invoice using the form on the left.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Customer","Items","Amount","Status","Date","Actions"].map(h => (
                      <th key={h} className="text-left px-5 sm:px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 sm:px-6 py-3.5">
                        <p className="font-semibold text-slate-900 text-sm leading-tight">{inv.customerName}</p>
                        {inv.customerPhone && <p className="text-slate-400 text-[11px] mt-0.5">{inv.customerPhone}</p>}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 max-w-[200px]">
                        <p className="text-slate-500 text-xs truncate">{(inv.products||[]).map(p=>`${p.qty}× ${p.name}`).join(", ")}</p>
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 whitespace-nowrap">
                        <p className="font-bold text-slate-900">₹{Number(inv.finalAmount??inv.total??inv.grandTotal??0).toFixed(2)}</p>
                        {inv.paymentMode && <p className="text-slate-400 text-[11px] mt-0.5">{inv.paymentMode}</p>}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5"><PayBadge status={inv.paymentStatus} onClick={() => openModal(inv)} /></td>
                      <td className="px-5 sm:px-6 py-3.5 text-slate-400 text-xs whitespace-nowrap">{fmt(inv.timestamp)}</td>
                      <td className="px-5 sm:px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Link href={`/invoice/${inv.id}`} target="_blank" className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold transition">View</Link>
                          <button onClick={() => resendWhatsApp(inv)} className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold transition">Re-send</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-slate-100">
              {invoices.map(inv => (
                <div key={inv.id} className="px-4 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-bold text-slate-900 text-sm truncate">{inv.customerName}</p>
                      <p className="text-slate-400 text-xs mt-0.5 truncate">{(inv.products||[]).map(p=>`${p.qty}× ${p.name}`).join(", ")}</p>
                    </div>
                    <p className="font-extrabold text-slate-900 text-base shrink-0">₹{Number(inv.finalAmount??inv.total??inv.grandTotal??0).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-2">
                      <PayBadge status={inv.paymentStatus} onClick={() => openModal(inv)} />
                      {inv.paymentMode && <span className="text-slate-400 text-[10px]">{inv.paymentMode}</span>}
                    </div>
                    <div className="flex gap-3">
                      <Link href={`/invoice/${inv.id}`} target="_blank" className="text-indigo-600 text-xs font-semibold">View</Link>
                      <button onClick={() => resendWhatsApp(inv)} className="text-emerald-600 text-xs font-semibold">Re-send</button>
                    </div>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-2">{fmt(inv.timestamp)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Payment Modal ───────────────────────────────────────────── */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">Update Payment</h3>
              <button onClick={() => setEditingPayment(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-slate-500 text-xs mb-5">
              {editingPayment.customerName} · <span className="font-semibold text-slate-700">₹{Number(editingPayment.finalAmount??editingPayment.total??editingPayment.grandTotal??0).toFixed(2)}</span>
            </p>
            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Payment Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {statusPills.map(({ val, label, sel, unsel }) => (
                    <button key={val} type="button" onClick={() => setPaymentStatus(val)}
                      className={`h-10 rounded-xl border-2 text-xs font-bold transition-all ${paymentStatus===val ? sel : unsel}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">Amount Paid (₹)</label>
                <input type="number" min="0" step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
                  className="w-full h-11 bg-white border-2 border-slate-200 text-slate-900 rounded-xl px-3.5 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingPayment(null)}
                  className="flex-1 h-11 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition border border-slate-200">
                  Cancel
                </button>
                <button type="submit" disabled={updatingPayment}
                  className="flex-1 h-11 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-500/20 disabled:opacity-50">
                  {updatingPayment ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={handleExportCSV} title="Export Invoices (CSV)" />
    </div>
  );
}
