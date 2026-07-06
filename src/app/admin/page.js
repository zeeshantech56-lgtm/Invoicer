// src/app/admin/page.js
// Admin-only panel. Access gated two ways:
//  1. UI: ProtectedRoute redirects anyone whose email != ADMIN_EMAIL
//  2. DATA: Firestore rules only let ADMIN_EMAIL's UID read the full
//     "users" collection and all invoices with no date limit.
// Both must agree, or a locked-out admin can't see data even past the UI gate.

"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { subscribeToAllInvoices } from "@/lib/invoices";
import ProtectedRoute from "@/components/ProtectedRoute";
import Logo from "@/components/Logo";
import Link from "next/link";

function AdminContent() {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [savingAnnounce, setSavingAnnounce] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [timeFilter, setTimeFilter] = useState("14d");

  useEffect(() => {
    const fetchShops = async () => {
      const snap = await getDocs(collection(db, "users"));
      setShops(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchShops();

    const fetchAnnouncement = async () => {
      const snap = await getDoc(doc(db, "platformConfig", "announcement"));
      if (snap.exists()) setAnnouncement(snap.data().text || "");
    };
    fetchAnnouncement();

    const unsubscribe = subscribeToAllInvoices((data) => {
      setInvoices(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const shopNameById = useMemo(() => {
    const map = {};
    shops.forEach((s) => (map[s.id] = s.shopName));
    return map;
  }, [shops]);

  const invoicesByShop = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      map[inv.shopId] = (map[inv.shopId] || 0) + 1;
    });
    return map;
  }, [invoices]);

  const revenueByShop = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      map[inv.shopId] = (map[inv.shopId] || 0) + Number(inv.total || 0);
    });
    return map;
  }, [invoices]);

  const filteredInvoices = invoices.filter((inv) => {
    if (selectedShopId && inv.shopId !== selectedShopId) return false;
    const q = search.toLowerCase();
    return (
      inv.customerName?.toLowerCase().includes(q) ||
      inv.shopName?.toLowerCase().includes(q) ||
      inv.customerPhone?.includes(q)
    );
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "Just now";
    return timestamp.toDate().toLocaleString();
  };

  const exportShopsCSV = () => {
    const headers = ["Shop ID", "Shop Name", "Email", "Invoices Sent", "Revenue", "Status", "Joined"];
    const rows = shops.map(s => {
      const joined = s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : "";
      return [
        s.id,
        `"${(s.shopName || "").replace(/"/g, '""')}"`,
        s.email,
        invoicesByShop[s.id] || 0,
        revenueByShop[s.id] || 0,
        s.banned ? "Banned" : "Active",
        `"${joined}"`
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `shops_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportInvoicesCSV = () => {
    const headers = ["Invoice ID", "Shop", "Customer", "Phone", "Total", "Date"];
    const rows = invoices.map(inv => {
      const date = inv.timestamp?.toDate ? inv.timestamp.toDate().toLocaleString() : "";
      return [
        inv.id,
        `"${(inv.shopName || shopNameById[inv.shopId] || "").replace(/"/g, '""')}"`,
        `"${(inv.customerName || "").replace(/"/g, '""')}"`,
        inv.customerPhone,
        inv.total || 0,
        `"${date}"`
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `invoices_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const saveAnnouncement = async () => {
    setSavingAnnounce(true);
    await setDoc(doc(db, "platformConfig", "announcement"), { text: announcement });
    setSavingAnnounce(false);
  };

  const getShopStatus = (shop) => {
    const now = Date.now();
    const createdAt = shop.createdAt?.toMillis() || now;
    const trialEnd = createdAt + (72 * 60 * 60 * 1000);
    const subUntil = shop.subscriptionUntil?.toMillis() || null;
    
    if (subUntil && subUntil > now) {
      const daysLeft = Math.ceil((subUntil - now) / (1000 * 60 * 60 * 24));
      const exactDate = new Date(subUntil).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const tag = shop.planType ? `${shop.planType}` : 'Active';
      
      if (daysLeft <= 7) return (
        <div className="flex flex-col gap-1 items-start">
          <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded whitespace-nowrap font-medium border border-yellow-200">{tag}</span>
          <span className="text-[10px] text-gray-500 whitespace-nowrap">Expires: {exactDate} ({daysLeft}d left)</span>
        </div>
      );
      
      return (
        <div className="flex flex-col gap-1 items-start">
          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded whitespace-nowrap font-medium border border-blue-200">{tag}</span>
          <span className="text-[10px] text-gray-500 whitespace-nowrap">Expires: {exactDate}</span>
        </div>
      );
    }
    
    if (now < trialEnd) {
      const hoursLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60));
      return <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded whitespace-nowrap">Trial ({hoursLeft}h)</span>;
    }
    
    return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded whitespace-nowrap">Expired</span>;
  };

  const handleBan = async (shop) => {
    if (shop.banned) {
      await updateDoc(doc(db, "users", shop.id), { banned: false, banReason: null });
      setShops(shops.map(s => s.id === shop.id ? { ...s, banned: false, banReason: null } : s));
    } else {
      const reason = window.prompt("Enter a reason or custom lock message for this user:", "Your account has been suspended by the admin.");
      if (reason !== null) {
        await updateDoc(doc(db, "users", shop.id), { banned: true, banReason: reason });
        setShops(shops.map(s => s.id === shop.id ? { ...s, banned: true, banReason: reason } : s));
      }
    }
  };

  const handleAddPlan = async (shop, months, planName) => {
    if (!window.confirm(`Grant ${planName} of access to ${shop.shopName}?`)) return;
    
    const now = Date.now();
    const currentSub = shop.subscriptionUntil?.toMillis() || 0;
    // Start from now if expired, or extend if currently active
    const newStart = currentSub > now ? currentSub : now;
    const newEnd = new Date(newStart + (months * 30 * 24 * 60 * 60 * 1000));
    
    await updateDoc(doc(db, "users", shop.id), { 
      subscriptionUntil: newEnd,
      hasSubscribedBefore: true,
      planType: planName
    });
    
    // Quick mock of firestore timestamp for instant UI update
    const mockTimestamp = { toDate: () => newEnd, toMillis: () => newEnd.getTime() };
    setShops(shops.map(s => s.id === shop.id ? { ...s, subscriptionUntil: mockTimestamp, hasSubscribedBefore: true, planType: planName } : s));
  };

  const growthData = useMemo(() => {
    let data = [];
    const now = new Date();
    
    if (timeFilter === "7d" || timeFilter === "14d" || timeFilter === "30d") {
      const days = timeFilter === "7d" ? 7 : (timeFilter === "30d" ? 30 : 14);
      data = Array.from({ length: days }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1) + i);
        d.setHours(0, 0, 0, 0);
        return { date: d, revenue: 0, signups: 0, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
      });

      invoices.forEach(inv => {
        if (!inv.timestamp?.toDate) return;
        const invDate = inv.timestamp.toDate();
        invDate.setHours(0, 0, 0, 0);
        const match = data.find(c => c.date.getTime() === invDate.getTime());
        if (match) match.revenue += Number(inv.total || 0);
      });

      shops.forEach(shop => {
        if (!shop.createdAt?.toDate) return;
        const shopDate = shop.createdAt.toDate();
        shopDate.setHours(0, 0, 0, 0);
        const match = data.find(c => c.date.getTime() === shopDate.getTime());
        if (match) match.signups += 1;
      });

    } else if (timeFilter === "1y") {
      // Past 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        data.push({ yearMonth: `${d.getFullYear()}-${d.getMonth()}`, revenue: 0, signups: 0, label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) });
      }

      invoices.forEach(inv => {
        if (!inv.timestamp?.toDate) return;
        const invDate = inv.timestamp.toDate();
        const ym = `${invDate.getFullYear()}-${invDate.getMonth()}`;
        const match = data.find(c => c.yearMonth === ym);
        if (match) match.revenue += Number(inv.total || 0);
      });

      shops.forEach(shop => {
        if (!shop.createdAt?.toDate) return;
        const shopDate = shop.createdAt.toDate();
        const ym = `${shopDate.getFullYear()}-${shopDate.getMonth()}`;
        const match = data.find(c => c.yearMonth === ym);
        if (match) match.signups += 1;
      });
    } else if (timeFilter === "all") {
      // Lifetime (by year)
      const years = {};
      invoices.forEach(inv => {
        if (!inv.timestamp?.toDate) return;
        const y = inv.timestamp.toDate().getFullYear();
        if (!years[y]) years[y] = { revenue: 0, signups: 0, label: y.toString() };
        years[y].revenue += Number(inv.total || 0);
      });
      shops.forEach(shop => {
        if (!shop.createdAt?.toDate) return;
        const y = shop.createdAt.toDate().getFullYear();
        if (!years[y]) years[y] = { revenue: 0, signups: 0, label: y.toString() };
        years[y].signups += 1;
      });
      
      const sortedYears = Object.keys(years).sort();
      if (sortedYears.length === 0) {
        data = [{ revenue: 0, signups: 0, label: now.getFullYear().toString() }];
      } else {
        data = sortedYears.map(y => years[y]);
      }
    }

    return data;
  }, [timeFilter, invoices, shops]);

  const maxRevenue = Math.max(...growthData.map(d => d.revenue), 1);
  const maxSignups = Math.max(...growthData.map(d => d.signups), 1);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded uppercase tracking-wide">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50"
          >
            My dashboard
          </Link>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-end gap-3 mb-6">
          <button onClick={exportShopsCSV} className="text-xs border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 text-gray-700 font-medium">Export All Shops (CSV)</button>
          <button onClick={exportInvoicesCSV} className="text-xs border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 text-gray-700 font-medium">Export All Invoices (CSV)</button>
        </div>

        {/* Global Announcement */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Global Announcement Banner</h2>
            <button 
              onClick={saveAnnouncement} 
              disabled={savingAnnounce}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {savingAnnounce ? "Saving..." : "Save Banner"}
            </button>
          </div>
          <input
            type="text"
            placeholder="e.g. Scheduled maintenance tonight at 10 PM. Please save your work!"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="w-full border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Platform Growth Charts */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Platform Growth</h2>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              <option value="7d">Past 7 Days</option>
              <option value="14d">Past 14 Days</option>
              <option value="30d">Past 30 Days</option>
              <option value="1y">Past 12 Months</option>
              <option value="all">Lifetime (Years)</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6 flex flex-col justify-end">
              <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Revenue</p>
              <SparklineChart data={growthData} dataKey="revenue" color="#10B981" />
            </div>
            <div className="border border-gray-200 rounded-lg p-6 flex flex-col justify-end">
              <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">New Shops</p>
              <SparklineChart data={growthData} dataKey="signups" color="#3B82F6" />
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total shops" value={shops.length} />
          <StatCard label="Total invoices" value={invoices.length} />
          <StatCard label="Total revenue" value={`₹${totalRevenue.toFixed(2)}`} />
          <StatCard
            label="Active shops (sent ≥1 invoice)"
            value={Object.keys(invoicesByShop).length}
          />
        </div>

        {/* Shops table */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
            All shops
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase">
                  <th className="pb-2 pr-4">Shop name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Invoices</th>
                  <th className="pb-2 pr-4">Plan Status</th>
                  <th className="pb-2 pr-4">Account</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => (
                  <tr key={shop.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-900">{shop.shopName}</td>
                    <td className="py-3 pr-4 text-gray-600">{shop.email}</td>
                    <td className="py-3 pr-4 text-gray-600">{invoicesByShop[shop.id] || 0}</td>
                    <td className="py-3 pr-4">
                      {getShopStatus(shop)}
                    </td>
                    <td className="py-3 pr-4">
                      {shop.banned ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase tracking-wide">
                          Banned
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase tracking-wide">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded overflow-hidden mr-2">
                          <button onClick={() => handleAddPlan(shop, 1, "1 Month")} className="text-[10px] font-medium px-2 py-1 hover:bg-green-100 hover:text-green-800 border-r border-gray-200 text-gray-700 transition" title="Add 1 Month">1M</button>
                          <button onClick={() => handleAddPlan(shop, 3, "3 Months")} className="text-[10px] font-medium px-2 py-1 hover:bg-green-100 hover:text-green-800 border-r border-gray-200 text-gray-700 transition" title="Add 3 Months">3M</button>
                          <button onClick={() => handleAddPlan(shop, 6, "6 Months")} className="text-[10px] font-medium px-2 py-1 hover:bg-green-100 hover:text-green-800 border-r border-gray-200 text-gray-700 transition" title="Add 6 Months">6M</button>
                          <button onClick={() => handleAddPlan(shop, 12, "1 Year")} className="text-[10px] font-medium px-2 py-1 hover:bg-green-100 hover:text-green-800 text-gray-700 transition" title="Add 1 Year">1Y</button>
                        </div>
                        <button
                          onClick={() => handleBan(shop)}
                          className={`text-xs border rounded px-2 py-1 whitespace-nowrap ${
                            shop.banned
                              ? "border-gray-300 text-gray-600 hover:bg-gray-50"
                              : "border-red-300 text-red-600 hover:bg-red-50"
                          }`}
                        >
                          {shop.banned ? "Unban" : "Ban"}
                        </button>
                        <button
                          onClick={() => setSelectedShopId(selectedShopId === shop.id ? null : shop.id)}
                          className={`text-xs border rounded px-2 py-1 whitespace-nowrap ${
                            selectedShopId === shop.id 
                            ? "bg-blue-50 border-blue-300 text-blue-700" 
                            : "border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {selectedShopId === shop.id ? "Unfilter View" : "View Data"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All invoices, unrestricted by date */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              {selectedShopId ? `Invoices for ${shopNameById[selectedShopId] || "Selected Shop"}` : "All invoices (no date limit)"}
            </h2>
            <div className="flex gap-2 items-center">
              {selectedShopId && (
                <button 
                  onClick={() => setSelectedShopId(null)}
                  className="text-xs text-blue-600 hover:underline mr-2"
                >
                  Clear Filter
                </button>
              )}
              <input
                type="text"
                placeholder="Search customer, shop, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase">
                    <th className="pb-2 pr-4">Shop</th>
                    <th className="pb-2 pr-4">Customer</th>
                    <th className="pb-2 pr-4">Phone</th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-gray-600">
                        {inv.shopName || shopNameById[inv.shopId]}
                      </td>
                      <td className="py-2 pr-4 font-medium text-gray-900">
                        {inv.customerName}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">{inv.customerPhone}</td>
                      <td className="py-2 pr-4 text-gray-900">
                        ₹{Number(inv.total || 0).toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-gray-500 text-xs">
                        {formatDate(inv.timestamp)}
                      </td>
                      <td className="py-2">
                        <Link
                          href={`/invoice/${inv.id}`}
                          target="_blank"
                          className="text-xs text-blue-600 underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly>
      <AdminContent />
    </ProtectedRoute>
  );
}

function SparklineChart({ data, dataKey, color }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d[dataKey]), 1);

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - (d[dataKey] / max) * 90; // leave 10% top padding
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="relative w-full h-32 mt-4">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon 
          points={`0,100 ${points} 100,100`} 
          fill={`url(#grad-${dataKey})`} 
        />
        <polyline 
          points={points} 
          fill="none" 
          stroke={color} 
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
      {/* Tooltips */}
      <div className="absolute inset-0 flex">
        {data.map((d, i) => (
          <div key={i} className="flex-1 group relative h-full">
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 shadow-lg pointer-events-none">
              {d.label}: {dataKey === 'revenue' ? `₹${d.revenue.toFixed(0)}` : `${d.signups} shops`}
            </div>
            {/* vertical hover line */}
            <div className="hidden group-hover:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 pointer-events-none z-10"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
