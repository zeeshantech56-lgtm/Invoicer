// src/components/InvoiceHistory.js
// Live list of the logged-in shop's invoices from the last 30 days only.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { subscribeToShopInvoices, RETENTION_DAYS, buildWhatsAppUrl } from "@/lib/invoices";
import { db } from "@/lib/firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

export default function InvoiceHistory() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartFilter, setChartFilter] = useState("7d"); // "7d", "30d", "6m"
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [amountPaid, setAmountPaid] = useState("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    if (!user) return;
    setError(null);
    const unsubscribe = subscribeToShopInvoices(
      user.uid, 
      (data) => {
        setInvoices(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Firestore Listen Error:", err);
        setError("Unable to load invoices. Permission denied or connection error.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "Just now";
    return timestamp.toDate().toLocaleString();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysInvoices = invoices.filter((inv) => {
    if (!inv.timestamp?.toDate) return true;
    return inv.timestamp.toDate() >= today;
  });

  const todayCount = todaysInvoices.length;
  const todayTotal = todaysInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  const exportCSV = () => {
    const headers = ["Date", "Customer", "Phone", "Items", "Total"];
    const rows = invoices.map((inv) => {
      const date = inv.timestamp?.toDate ? inv.timestamp.toDate().toLocaleString() : "Just now";
      const customer = inv.customerName || "";
      const phone = inv.customerPhone || "";
      const items = (inv.products || []).map((p) => `${p.qty}x ${p.name}`).join("; ");
      const total = inv.total || 0;

      return [
        `"${date}"`,
        `"${customer.replace(/"/g, '""')}"`,
        `"${phone}"`,
        `"${items.replace(/"/g, '""')}"`,
        total
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resendWhatsApp = (inv) => {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const customFooter = localStorage.getItem("invoicer_custom_footer") || "";
    const waUrl = buildWhatsAppUrl({
      phone: inv.customerPhone,
      shopName: inv.shopName || "My Shop",
      customerName: inv.customerName,
      products: inv.products || [],
      total: inv.total || 0,
      invoiceId: inv.id,
      siteUrl,
      customFooter
    });
    window.open(waUrl, "_blank");
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!editingPayment) return;
    setUpdatingPayment(true);
    try {
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      await updateDoc(doc(db, "invoices", editingPayment.id), {
        paymentStatus,
        amountPaid: Number(amountPaid) || 0,
        updatedAt: serverTimestamp()
      });
      setEditingPayment(null);
    } catch (err) {
      alert("Error updating payment status: " + err.message);
    } finally {
      setUpdatingPayment(false);
    }
  };

  const openPaymentModal = (inv) => {
    setEditingPayment(inv);
    setPaymentStatus(inv.paymentStatus || "unpaid");
    setAmountPaid(inv.amountPaid || 0);
  };

  // Prepare data for the chart based on the selected filter
  let chartData = [];
  
  if (chartFilter === "7d") {
    chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (7 - 1) + i);
      d.setHours(0, 0, 0, 0);
      return { date: d, key: d.getTime(), total: 0, label: d.toLocaleDateString(undefined, { weekday: 'short' }) };
    });
  } else if (chartFilter === "30d") {
    chartData = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (30 - 1) + i);
      d.setHours(0, 0, 0, 0);
      const label = (i % 5 === 0 || i === 29) ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "";
      return { date: d, key: d.getTime(), total: 0, label };
    });
  } else if (chartFilter === "6m") {
    chartData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (6 - 1) + i);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return { date: d, key: d.getTime(), total: 0, label: d.toLocaleDateString(undefined, { month: 'short' }) };
    });
  }

  invoices.forEach(inv => {
    if (!inv.timestamp?.toDate) return;
    const invDate = inv.timestamp.toDate();
    
    if (chartFilter === "7d" || chartFilter === "30d") {
      const d = new Date(invDate);
      d.setHours(0, 0, 0, 0);
      const dayMatch = chartData.find(c => c.key === d.getTime());
      if (dayMatch) {
        dayMatch.total += Number(inv.total || 0);
      }
    } else if (chartFilter === "6m") {
      const match = chartData.find(c => c.date.getMonth() === invDate.getMonth() && c.date.getFullYear() === invDate.getFullYear());
      if (match) {
        match.total += Number(inv.total || 0);
      }
    }
  });

  const maxChartValue = Math.max(...chartData.map(d => d.total), 1);

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Recent transactions
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">Last {RETENTION_DAYS} days</span>
          <button
            onClick={exportCSV}
            disabled={invoices.length === 0}
            className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="grid grid-rows-2 gap-4">
          <div className="bg-gray-50 rounded p-4 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Today's Invoices</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{todayCount}</p>
          </div>
          <div className="bg-gray-50 rounded p-4 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Today's Sales</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">₹{todayTotal.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded p-4 border border-gray-100 flex flex-col justify-end relative">
          <div className="flex justify-between items-center mb-4 absolute top-4 left-4 right-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Sales Trend</p>
            <select
              value={chartFilter}
              onChange={(e) => setChartFilter(e.target.value)}
              className="text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="6m">Last 6 Months</option>
            </select>
          </div>
          <div className="h-48 mt-8 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Sales']}
                />
                <Bar 
                  dataKey="total" 
                  fill="#111827" 
                  radius={[4, 4, 0, 0]} 
                  barSize={chartFilter === '30d' ? 6 : (chartFilter === '6m' ? 32 : 24)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Payment Update Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Payment</h3>
            <p className="text-sm text-gray-500 mb-4">
              Invoice for <span className="font-medium text-gray-900">{editingPayment.customerName}</span><br/>
              Total: ₹{Number(editingPayment.total || editingPayment.grandTotal || 0).toFixed(2)}
            </p>
            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 rounded hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPayment}
                  className="flex-1 bg-gray-900 text-white text-sm font-medium py-2 rounded hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {updatingPayment ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md text-sm">
          {error}
        </div>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-gray-400">No invoices yet. Create your first one.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase">
                <th className="pb-2 pr-4">Customer</th>
                <th className="pb-2 pr-4">Items</th>
                <th className="pb-2 pr-4">Total</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">
                    {inv.customerName}
                  </td>
                  <td className="py-2 pr-4 text-gray-600 max-w-xs truncate">
                    {(inv.products || []).map((p) => `${p.qty}x ${p.name}`).join(", ")}
                  </td>
                  <td className="py-2 pr-4 text-gray-900 font-medium">
                    ₹{Number(inv.total || inv.grandTotal || 0).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4">
                    <button onClick={() => openPaymentModal(inv)} className="hover:opacity-80">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase
                        ${inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                          inv.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {inv.paymentStatus || 'unpaid'}
                      </span>
                    </button>
                  </td>
                  <td className="py-2 pr-4 text-gray-500 text-xs">
                    {formatDate(inv.timestamp)}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/invoice/${inv.id}`}
                        target="_blank"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => resendWhatsApp(inv)}
                        className="text-xs text-green-600 hover:underline"
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
      )}
    </div>
  );
}
