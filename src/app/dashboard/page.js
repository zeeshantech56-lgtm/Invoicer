// src/app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import InvoiceForm from "@/components/InvoiceForm";
import InvoiceHistory from "@/components/InvoiceHistory";
import Logo from "@/components/Logo";
import { useAccessStatus } from "@/lib/access";

function DashboardContent() {
  const { user, isAdmin } = useAuth();
  const [shopName, setShopName]           = useState("");
  const [userData, setUserData]           = useState(null);
  const [announcement, setAnnouncement]   = useState("");
  const [loading, setLoading]             = useState(true);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) { setShopName(snap.data().shopName); setUserData(snap.data()); }
      setLoading(false);

      const { collection, query, getDocs } = await import("firebase/firestore");
      const q = query(collection(db, "users", user.uid, "products"));
      const ps = await getDocs(q);
      setLowStockItems(ps.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => (p.stockQty || 0) <= (p.lowStockThreshold || 10)));

      const an = await getDoc(doc(db, "platformConfig", "announcement"));
      if (an.exists()) setAnnouncement(an.data().text || "");
    };
    fetchAll();
  }, [user]);

  const handleLogout = () => signOut(auth);

  const { isTrial, isSubscribed, daysLeftTrial, daysLeftSub, expiryDateString } = useAccessStatus(userData);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: "/dashboard/inventory", label: "Inventory" },
    { href: "/dashboard/purchases", label: "Purchases" },
    { href: "/dashboard/settings",  label: "Settings"  },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">

      {/* ── Banners ──────────────────────────────────────────────── */}
      {announcement && (
        <div className="bg-indigo-600 text-white text-xs font-medium text-center py-2.5 px-4">
          {announcement}
        </div>
      )}
      {!isAdmin && isTrial && !isSubscribed && (
        <div className="bg-amber-500 text-white text-xs font-semibold text-center py-2.5 px-4">
          Free Trial — {daysLeftTrial} day{daysLeftTrial !== 1 ? "s" : ""} remaining.{" "}
          <Link href="/pricing" className="underline">Upgrade now →</Link>
        </div>
      )}
      {!isAdmin && isSubscribed && daysLeftSub <= 7 && (
        <div className="bg-rose-500 text-white text-xs font-semibold text-center py-2.5 px-4">
          Subscription expires {expiryDateString} — please renew to avoid interruption.
        </div>
      )}
      {lowStockItems.length > 0 && (
        <div className="bg-orange-500 text-white text-xs font-semibold text-center py-2.5 px-4">
          ⚠ Low Stock: {lowStockItems.map(i => `${i.name} (${i.stockQty || 0} left)`).join(" · ")}
        </div>
      )}

      {/* ── Top Navigation ────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-500/40">
                <span className="text-white font-black text-sm">I</span>
              </div>
              <span className="font-bold text-slate-900 text-base tracking-tight hidden sm:block">Invoicer</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {navLinks.map(l => (
                <Link
                  key={l.href} href={l.href}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{shopName || "My Shop"}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-200 shrink-0">
                <span className="text-indigo-700 text-sm font-bold">
                  {(shopName || user?.email || "?")[0].toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-slate-200"
              >
                Sign out
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-100 py-3 space-y-1 pb-4">
              {navLinks.map(l => (
                <Link
                  key={l.href} href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  {l.label}
                </Link>
              ))}
              <div className="flex items-center justify-between px-3 pt-3 border-t border-slate-100 mt-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{shopName || "My Shop"}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-rose-600 hover:text-rose-700 transition"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">Create invoices and monitor your business</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Live
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Left — Invoice Form (5/12) */}
          <div className="xl:col-span-5">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">New Invoice</h2>
              <p className="text-xs text-slate-500 mt-0.5">Fill in customer details and add products</p>
            </div>
            <InvoiceForm shopName={shopName} />
          </div>

          {/* Right — Analytics + History (7/12) */}
          <div className="xl:col-span-7">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">Analytics &amp; Transactions</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time sales data from your last 180 days</p>
            </div>
            <InvoiceHistory />
          </div>

        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}
