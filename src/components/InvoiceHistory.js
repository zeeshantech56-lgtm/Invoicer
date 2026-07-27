// src/components/InvoiceHistory.js
// Live list of the logged-in shop's invoices from the last 30 days only.

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
function StatCard({ label, value, icon, accent = "indigo" }) {
  const accents = {
    indigo:  "from-indigo-600/20 to-indigo-600/5 border-indigo-500/20 text-indigo-400",
    emerald: "from-emerald-600/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
    amber:   "from-amber-600/20 to-amber-600/5 border-amber-500/20 text-amber-400",
    sky:     "from-sky-600/20 to-sky-600/5 border-sky-500/20 text-sky-400",
  };
  return (
    <div className={`stat-card bg-gradient-to-br ${accents[accent]} border rounded-xl p-4 flex flex-col gap-2 cursor-default`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{label}</span>
        <span className="text-lg leading-none">{icon}</span>
      </div>
      <p className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-none mt-1">{value}</p>
    </div>
  );
}

// ── Payment badge ─────────────────────────────────────────────────────────────
function PayBadge({ status, onClick }) {
  const styles = {
    paid:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25",
    partial: "bg-amber-500/15  text-amber-400  border-amber-500/25  hover:bg-amber-500/25",
    unpaid:  "bg-rose-500/15   text-rose-400   border-rose-500/25   hover:bg-rose-500/25",
  };
  const s = status || "unpaid";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition ${styles[s]}`}
    >
      {s}
    </button>
  );
}

// ── Section divider ────────────────────────────────────────────────────────────
function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-white/6" />
      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-white/6" />
    </div>
  );
}

// ── Custom chart tooltip ───────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1c2330] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-sm">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold">₹{Number(payload[0]?.value || 0).toFixed(2)}</p>
    </div>
  );
}

export default function InvoiceHistory() {
  const { user } = useAuth();
  const [invoices, setInvoices]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [chartFilter, setChartFilter]     = useState("7d");
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [amountPaid, setAmountPaid]       = useState("");
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    setError(null);
    const unsub = subscribeToShopInvoices(
      user.uid,
      data => { setInvoices(data); setLoading(false); setError(null); },
      err  => {
        console.error("Firestore Listen Error:", err);
        setError("Unable to load invoices. Permission denied or connection error.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  // ── Date helpers ──────────────────────────────────────────────────────────
  const formatDate = ts => {
    if (!ts?.toDate) return "Just now";
    return ts.toDate().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  const formatDateForCSV = ts => {
    if (!ts?.toDate) return "";
    const d = ts.toDate();
    return `${String(d.getDate()).padStart(2,"0")}-${d.toLocaleString("en-US",{month:"short"})}-${d.getFullYear()}`;
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todaysInvoices      = invoices.filter(inv => { if (!inv.timestamp?.toDate) return true; return inv.timestamp.toDate() >= today; });
  const todayCount          = todaysInvoices.length;
  const todayTotal          = todaysInvoices.reduce((s, inv) => s + Number(inv.finalAmount ?? inv.total ?? inv.grandTotal ?? 0), 0);
  const todayCashReceived   = todaysInvoices.reduce((s, inv) => s + Number(inv.cashAmount   || 0), 0);
  const todayOnlineReceived = todaysInvoices.reduce((s, inv) => s + Number(inv.onlineAmount || 0), 0);

  // ── Date filter for CSV export ────────────────────────────────────────────
  const applyDateFilter = (list, filterParams) => {
    const { rangeType, startDate, endDate } = filterParams;
    const now         = new Date();
    const startOfDay  = d => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const endOfDay    = d => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    let start = null, end = null;
    switch (rangeType) {
      case "today":      start = startOfDay(now); end = endOfDay(now); break;
      case "yesterday":  { const y = new Date(now); y.setDate(y.getDate()-1); start = startOfDay(y); end = endOfDay(y); break; }
      case "7d":         { const d = new Date(now); d.setDate(d.getDate()-6); start = startOfDay(d); end = endOfDay(now); break; }
      case "last_month": start = new Date(now.getFullYear(), now.getMonth()-1, 1); end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999); break;
      case "this_year":  start = new Date(now.getFullYear(), 0, 1); end = endOfDay(now); break;
      case "lifetime":   start = new Date(0); end = endOfDay(now); break;
      case "custom":     if (startDate) start = startOfDay(new Date(startDate)); if (endDate) end = endOfDay(new Date(endDate)); break;
    }
    return list.filter(inv => {
      if (!inv.timestamp?.toDate) return false;
      const d = inv.timestamp.toDate();
      if (start && d < start) return false;
      if (end   && d > end)   return false;
      return true;
    });
  };

  const handleExportCSV = filterParams => {
    const fi = applyDateFilter(invoices, filterParams);
    if (!fi.length) { alert("No invoices found for the selected date range."); return; }
    const headers = ["Invoice No","Date","Customer","Phone","Items","Grand Total","Discount","Final Amount","Cash Amount","Online Amount","Payment Mode","Status"];
    const rows = fi.map(inv => {
      const invoiceNo  = `INV${inv.id.slice(0,8).toUpperCase()}`;
      const date       = formatDateForCSV(inv.timestamp);
      const customer   = inv.customerName || "";
      const phone      = inv.customerPhone || "";
      const items      = (inv.products||[]).map(p=>`${p.qty}x ${p.name}`).join("; ");
      const grandTotal = inv.grandTotal ?? inv.total ?? 0;
      const discount   = inv.discountAmount ?? 0;
      const finalAmt   = inv.finalAmount ?? grandTotal;
      const cashAmt    = Number(inv.cashAmount  || 0);
      const onlineAmt  = Number(inv.onlineAmount|| 0);
      const mode       = inv.paymentMode || "Unknown";
      const status     = inv.paymentStatus || "unpaid";
      return [`"${invoiceNo}"`,`"${date}"`,`"${customer.replace(/"/g,'""')}"`,`"${phone}"`,`"${items.replace(/"/g,'""')}"`,grandTotal,discount,finalAmt,cashAmt,onlineAmt,`"${mode}"`,`"${status}"`].join(",");
    });
    const totalSales  = fi.reduce((s,inv) => s + Number(inv.finalAmount ?? inv.total ?? inv.grandTotal ?? 0), 0);
    const totalCash   = fi.reduce((s,inv) => s + Number(inv.cashAmount   || 0), 0);
    const totalOnline = fi.reduce((s,inv) => s + Number(inv.onlineAmount || 0), 0);
    const csv = ["data:text/csv;charset=utf-8,", [headers.join(","), ...rows, "", "Report Summary", `Total Invoices,${fi.length}`, `Total Sales,₹${totalSales.toFixed(2)}`, `Cash,₹${totalCash.toFixed(2)}`, `Online,₹${totalOnline.toFixed(2)}`].join("\n")].join("");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `invoices_${filterParams.rangeType}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const resendWhatsApp = inv => {
    const siteUrl     = typeof window !== "undefined" ? window.location.origin : "";
    const customFooter= localStorage.getItem("invoicer_custom_footer") || "";
    const waUrl       = buildWhatsAppUrl({ phone: inv.customerPhone, shopName: inv.shopName || "My Shop", customerName: inv.customerName, products: inv.products || [], total: inv.finalAmount ?? inv.total ?? inv.grandTotal ?? 0, invoiceId: inv.id, siteUrl, customFooter, paymentStatus: inv.paymentStatus, amountPaid: inv.amountPaid });
    window.open(waUrl, "_blank");
  };

  const handleUpdatePayment = async e => {
    e.preventDefault();
    if (!editingPayment) return;
    setUpdatingPayment(true);
    try {
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      await updateDoc(doc(db, "invoices", editingPayment.id), { paymentStatus, amountPaid: Number(amountPaid) || 0, updatedAt: serverTimestamp() });
      setEditingPayment(null);
    } catch (err) { alert("Error: " + err.message); } finally { setUpdatingPayment(false); }
  };

  const openPaymentModal = inv => { setEditingPayment(inv); setPaymentStatus(inv.paymentStatus || "unpaid"); setAmountPaid(inv.amountPaid || 0); };

  // ── Chart data ────────────────────────────────────────────────────────────
  let chartData = [];
  if (chartFilter === "7d") {
    chartData = Array.from({length:7}).map((_,i) => { const d=new Date(); d.setDate(d.getDate()-(7-1)+i); d.setHours(0,0,0,0); return {date:d, key:d.getTime(), total:0, label:d.toLocaleDateString(undefined,{weekday:"short"})}; });
  } else if (chartFilter === "30d") {
    chartData = Array.from({length:30}).map((_,i) => { const d=new Date(); d.setDate(d.getDate()-(30-1)+i); d.setHours(0,0,0,0); return {date:d, key:d.getTime(), total:0, label:d.toLocaleDateString(undefined,{month:"short",day:"numeric"})}; });
  } else if (chartFilter === "6m") {
    chartData = Array.from({length:6}).map((_,i) => { const d=new Date(); d.setMonth(d.getMonth()-(6-1)+i); d.setDate(1); d.setHours(0,0,0,0); return {date:d, key:d.getTime(), total:0, label:d.toLocaleDateString(undefined,{month:"short"})}; });
  }

  invoices.forEach(inv => {
    if (!inv.timestamp?.toDate) return;
    const invDate = inv.timestamp.toDate();
    if (chartFilter === "7d" || chartFilter === "30d") {
      const d = new Date(invDate); d.setHours(0,0,0,0);
      const match = chartData.find(c => c.key === d.getTime());
      if (match) match.total += Number(inv.finalAmount ?? inv.total ?? inv.grandTotal ?? 0);
    } else if (chartFilter === "6m") {
      const match = chartData.find(c => c.date.getMonth() === invDate.getMonth() && c.date.getFullYear() === invDate.getFullYear());
      if (match) match.total += Number(inv.finalAmount ?? inv.total ?? inv.grandTotal ?? 0);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── KPI Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Today's Invoices" value={todayCount}                               icon="📄" accent="indigo"  />
        <StatCard label="Today's Sales"    value={`₹${todayTotal.toFixed(2)}`}             icon="💰" accent="emerald" />
        <StatCard label="Cash Received"    value={`₹${todayCashReceived.toFixed(2)}`}      icon="💵" accent="amber"   />
        <StatCard label="Online Received"  value={`₹${todayOnlineReceived.toFixed(2)}`}    icon="📱" accent="sky"     />
      </div>

      {/* ── Sales Trend Chart ───────────────────────────────────────────── */}
      <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-sm tracking-tight">Sales Trend</h3>
            <p className="text-slate-500 text-xs mt-0.5">Revenue over time</p>
          </div>
          <div className="flex gap-1 bg-white/4 border border-white/8 rounded-xl p-1">
            {[{val:"7d",label:"7D"},{val:"30d",label:"30D"},{val:"6m",label:"6M"}].map(({val,label}) => (
              <button
                key={val}
                onClick={() => setChartFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                  ${chartFilter === val ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{height: 200}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{top:4, right:4, left:-20, bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label" axisLine={false} tickLine={false}
                tick={{fontSize:10, fill:"#4b5563"}} dy={8}
                interval={chartFilter==="30d" ? 4 : 0}
                angle={chartFilter==="30d" ? -35 : 0}
                textAnchor={chartFilter==="30d" ? "end" : "middle"}
                height={chartFilter==="30d" ? 40 : 20}
              />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize:10, fill:"#4b5563"}} tickFormatter={v=>`₹${v}`} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{fill:"rgba(99,102,241,0.08)"}} />
              <Bar dataKey="total" fill="#6366f1" radius={[5,5,0,0]} barSize={chartFilter==="30d"?8:(chartFilter==="6m"?32:20)} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Transaction Table ───────────────────────────────────────────── */}
      <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/6">
          <div>
            <h3 className="text-white font-bold text-sm tracking-tight">Recent Transactions</h3>
            <p className="text-slate-500 text-xs mt-0.5">Last {RETENTION_DAYS} days</p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            disabled={invoices.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white
              border border-white/10 hover:border-white/20 px-3 py-2 rounded-xl bg-white/4 hover:bg-white/8
              transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading transactions…</p>
          </div>
        ) : error ? (
          <div className="m-4 bg-rose-600/15 border border-rose-500/25 text-rose-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <div className="w-14 h-14 bg-white/4 border border-white/8 rounded-2xl flex items-center justify-center text-2xl">📄</div>
            <p className="text-white font-semibold text-sm">No invoices yet</p>
            <p className="text-slate-500 text-xs">Create your first invoice using the form on the left.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/6 text-left">
                    {["Customer","Items","Amount","Status","Date","Action"].map(h => (
                      <th key={h} className="px-5 sm:px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => (
                    <tr key={inv.id} className={`border-b border-white/4 hover:bg-white/3 transition group ${idx % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                      <td className="px-5 sm:px-6 py-3.5">
                        <p className="font-semibold text-white text-sm leading-tight">{inv.customerName}</p>
                        {inv.customerPhone && <p className="text-slate-600 text-[10px] mt-0.5">{inv.customerPhone}</p>}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 max-w-[180px]">
                        <p className="text-slate-400 text-xs truncate">{(inv.products||[]).map(p=>`${p.qty}× ${p.name}`).join(", ")}</p>
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 whitespace-nowrap">
                        <p className="text-white font-bold">₹{Number(inv.finalAmount ?? inv.total ?? inv.grandTotal ?? 0).toFixed(2)}</p>
                        {inv.paymentMode && <p className="text-slate-600 text-[10px] mt-0.5">{inv.paymentMode}</p>}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5">
                        <PayBadge status={inv.paymentStatus} onClick={() => openPaymentModal(inv)} />
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(inv.timestamp)}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/invoice/${inv.id}`} target="_blank"
                            className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => resendWhatsApp(inv)}
                            className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition"
                          >
                            Re-send
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-white/6">
              {invoices.map(inv => (
                <div key={inv.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm leading-tight truncate">{inv.customerName}</p>
                      <p className="text-slate-500 text-xs mt-0.5 truncate">{(inv.products||[]).map(p=>`${p.qty}× ${p.name}`).join(", ")}</p>
                    </div>
                    <p className="text-white font-extrabold text-base shrink-0">
                      ₹{Number(inv.finalAmount ?? inv.total ?? inv.grandTotal ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PayBadge status={inv.paymentStatus} onClick={() => openPaymentModal(inv)} />
                      {inv.paymentMode && <span className="text-slate-600 text-[10px]">{inv.paymentMode}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={`/invoice/${inv.id}`} target="_blank" className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold">View</Link>
                      <button onClick={() => resendWhatsApp(inv)} className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold">Re-send</button>
                    </div>
                  </div>
                  <p className="text-slate-600 text-[10px] mt-1.5">{formatDate(inv.timestamp)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Payment Update Modal ────────────────────────────────────────── */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-white mb-1">Update Payment</h3>
            <p className="text-slate-500 text-sm mb-5">
              Invoice for <span className="text-white font-semibold">{editingPayment.customerName}</span><br />
              <span className="text-slate-600 text-xs">Final Amount: ₹{Number(editingPayment.finalAmount ?? editingPayment.total ?? editingPayment.grandTotal ?? 0).toFixed(2)}</span>
            </p>
            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[["paid","Paid","emerald"],["partial","Partial","amber"],["unpaid","Unpaid","rose"]].map(([val,label,color]) => (
                    <button
                      key={val} type="button" onClick={() => setPaymentStatus(val)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition
                        ${paymentStatus === val
                          ? color==="emerald" ? "bg-emerald-600/30 border-emerald-500/50 text-emerald-300"
                            : color==="amber" ? "bg-amber-600/30 border-amber-500/50 text-amber-300"
                            : "bg-rose-600/30 border-rose-500/50 text-rose-300"
                          : "bg-white/4 border-white/10 text-slate-400 hover:text-white hover:bg-white/8"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Amount Paid (₹)</label>
                <input
                  type="number" min="0" step="0.01" value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  className="w-full bg-[#161b22] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingPayment(null)}
                  className="flex-1 bg-white/6 text-slate-300 text-sm font-semibold py-3 rounded-xl hover:bg-white/10 transition border border-white/8">
                  Cancel
                </button>
                <button type="submit" disabled={updatingPayment}
                  className="flex-1 bg-indigo-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-indigo-500 transition disabled:opacity-50">
                  {updatingPayment ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportCSV}
        title="Export Invoices (CSV)"
      />
    </div>
  );
}
