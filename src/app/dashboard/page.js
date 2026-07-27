// src/app/dashboard/page.js
// Protected shop-owner dashboard: quick invoice entry + transaction history.

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

// ─── Sidebar nav item ───────────────────────────────────────────────────────
function NavItem({ href, icon, label, active }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
        ${active
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
          : "text-slate-400 hover:text-white hover:bg-white/8"
        }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

// ─── Alert banner ────────────────────────────────────────────────────────────
function AlertBanner({ color, children }) {
  const colors = {
    blue:   "bg-indigo-600/90",
    amber:  "bg-amber-500/90",
    red:    "bg-red-500/90",
    rose:   "bg-rose-600/90",
  };
  return (
    <div className={`${colors[color]} text-white text-xs font-medium text-center py-2.5 px-4 backdrop-blur-sm`}>
      {children}
    </div>
  );
}

// ─── Main content ────────────────────────────────────────────────────────────
function DashboardContent() {
  const { user, isAdmin } = useAuth();
  const [shopName, setShopName]       = useState("");
  const [userData, setUserData]       = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [loading, setLoading]         = useState(true);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchShopProfile = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setShopName(snap.data().shopName);
        setUserData(snap.data());
      }
      setLoading(false);
    };
    fetchShopProfile();

    const fetchLowStock = async () => {
      if (!user) return;
      const { collection, query, getDocs } = await import("firebase/firestore");
      const q = query(collection(db, "users", user.uid, "products"));
      const snap = await getDocs(q);
      const low = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => (p.stockQty || 0) <= (p.lowStockThreshold || 10));
      setLowStockItems(low);
    };
    fetchLowStock();

    const fetchAnnouncement = async () => {
      const snap = await getDoc(doc(db, "platformConfig", "announcement"));
      if (snap.exists()) setAnnouncement(snap.data().text || "");
    };
    fetchAnnouncement();
  }, [user]);

  const handleLogout = async () => { await signOut(auth); };

  const { isTrial, isSubscribed, daysLeftTrial, daysLeftSub, expiryDateString } =
    useAccessStatus(userData);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // Sidebar links
  const navLinks = [
    { href: "/dashboard",            icon: "⚡", label: "Dashboard", active: true  },
    { href: "/dashboard/inventory",  icon: "📦", label: "Inventory",  active: false },
    { href: "/dashboard/purchases",  icon: "🛒", label: "Purchases",  active: false },
    { href: "/dashboard/settings",   icon: "⚙️",  label: "Settings",   active: false },
    ...(isAdmin ? [{ href: "/admin", icon: "🛡️", label: "Admin",      active: false }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">

      {/* ── Alert banners ───────────────────────────────────────────────── */}
      {announcement && <AlertBanner color="blue">{announcement}</AlertBanner>}
      {!isAdmin && isTrial && !isSubscribed && (
        <AlertBanner color="amber">
          Free Trial — {daysLeftTrial} day{daysLeftTrial !== 1 ? "s" : ""} remaining.{" "}
          <Link href="/pricing" className="underline font-semibold">Upgrade now →</Link>
        </AlertBanner>
      )}
      {!isAdmin && isSubscribed && daysLeftSub <= 7 && (
        <AlertBanner color="red">
          Subscription expires on {expiryDateString}. Please renew to avoid interruption.
        </AlertBanner>
      )}
      {lowStockItems.length > 0 && (
        <AlertBanner color="rose">
          ⚠ Low Stock: {lowStockItems.map(i => `${i.name} (${i.stockQty || 0} left)`).join(" · ")}
        </AlertBanner>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* ══════════════════════════════════════════════════════════════
            SIDEBAR — hidden on mobile, fixed on desktop
        ══════════════════════════════════════════════════════════════ */}
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0d1117] border-r border-white/6
            flex flex-col transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/30">
              I
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-tight leading-tight">Invoicer</p>
              <p className="text-slate-500 text-[10px] truncate max-w-[140px]">{shopName || user?.email}</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Menu</p>
            {navLinks.map(l => <NavItem key={l.href} {...l} />)}
          </nav>

          {/* User block + Logout */}
          <div className="px-3 pb-4 border-t border-white/6 pt-3 space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                {(shopName || user?.email || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{shopName || "Dashboard"}</p>
                <p className="text-slate-500 text-[10px] truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/6 rounded-xl text-sm font-medium transition-all"
            >
              <span>↩</span> Sign out
            </button>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════════════
            MAIN AREA
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Top bar (mobile + desktop) ─────────────────────────── */}
          <header className="bg-[#0d1117] border-b border-white/6 flex items-center gap-3 px-4 sm:px-6 py-3.5 shrink-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/8 transition"
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-base sm:text-lg tracking-tight truncate">Dashboard</h1>
              <p className="text-slate-500 text-xs hidden sm:block">Create invoices and track your sales</p>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/"
                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/6 transition"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Home
              </Link>
            </div>
          </header>

          {/* ── Scrollable content ─────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto">

              {/* Mobile: stacked, Desktop: side-by-side (5/7 split) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">

                {/* ── LEFT: Invoice Form ──────────────────────────── */}
                <div className="xl:col-span-5 space-y-1">
                  <div className="mb-4">
                    <h2 className="text-white font-bold text-lg tracking-tight">New Invoice</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Fill in customer details and products below.</p>
                  </div>
                  <InvoiceForm shopName={shopName} />
                </div>

                {/* ── RIGHT: Analytics & History ─────────────────── */}
                <div className="xl:col-span-7 space-y-1">
                  <div className="mb-4">
                    <h2 className="text-white font-bold text-lg tracking-tight">Transactions & Analytics</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Live data from your last 180 days of activity.</p>
                  </div>
                  <InvoiceHistory />
                </div>

              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
