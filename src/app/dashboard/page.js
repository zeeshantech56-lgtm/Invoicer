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

function DashboardContent() {
  const { user, isAdmin } = useAuth();
  const [shopName, setShopName] = useState("");
  const [userData, setUserData] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState([]);

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
      const low = snap.docs.map(d => ({id: d.id, ...d.data()})).filter(p => (p.stockQty || 0) <= (p.lowStockThreshold || 10));
      setLowStockItems(low);
    };
    fetchLowStock();

    const fetchAnnouncement = async () => {
      const snap = await getDoc(doc(db, "platformConfig", "announcement"));
      if (snap.exists()) setAnnouncement(snap.data().text || "");
    };
    fetchAnnouncement();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const { isTrial, isSubscribed, daysLeftTrial, daysLeftSub, expiryDateString } = useAccessStatus(userData);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {announcement && (
        <div className="bg-blue-600 text-white text-xs font-medium text-center py-2 px-4 shadow-sm">
          {announcement}
        </div>
      )}
      {!isAdmin && isTrial && !isSubscribed && (
        <div className="bg-amber-500 text-white text-xs font-medium text-center py-2 px-4 shadow-sm">
          You are on a Free Trial. {daysLeftTrial} day{daysLeftTrial !== 1 ? 's' : ''} remaining until it expires.
        </div>
      )}
      {!isAdmin && isSubscribed && daysLeftSub <= 7 && (
        <div className="bg-red-500 text-white text-xs font-medium text-center py-2 px-4 shadow-sm">
          Warning: Payment due on {expiryDateString}. Please renew to avoid interruption.
        </div>
      )}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-600 text-white text-xs font-medium text-center py-2 px-4 shadow-sm">
          Low Stock Alert: {lowStockItems.map(item => `${item.name} (${item.stockQty || 0} left)`).join(", ")}
        </div>
      )}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-y-3 gap-x-2 relative z-10">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200 px-2 sm:px-3 py-1.5 rounded-full hover:bg-gray-100 transition flex items-center gap-1 whitespace-nowrap"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Home</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <Link
            href="/dashboard/inventory"
            className="text-xs sm:text-sm text-gray-600 border border-gray-200 bg-white rounded-lg shadow-sm px-2 sm:px-3 py-1.5 hover:bg-gray-50 whitespace-nowrap transition"
          >
            Inventory
          </Link>
          <Link
            href="/dashboard/purchases"
            className="text-xs sm:text-sm text-gray-600 border border-gray-200 bg-white rounded-lg shadow-sm px-2 sm:px-3 py-1.5 hover:bg-gray-50 whitespace-nowrap transition"
          >
            Purchases
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-xs sm:text-sm text-gray-600 border border-gray-200 bg-white rounded-lg shadow-sm px-2 sm:px-3 py-1.5 hover:bg-gray-50 whitespace-nowrap transition"
          >
            Settings
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs sm:text-sm text-gray-600 border border-gray-200 bg-white rounded-lg shadow-sm px-2 sm:px-3 py-1.5 hover:bg-gray-50 whitespace-nowrap transition"
            >
              Admin
            </Link>
          )}
          <div className="text-right hidden sm:block ml-2">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{shopName || "Dashboard"}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs sm:text-sm text-gray-600 border border-gray-200 bg-white rounded-lg shadow-sm px-2 sm:px-3 py-1.5 hover:bg-gray-50 whitespace-nowrap transition ml-1"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Left Panel: Invoice Form */}
          <div className="lg:col-span-5 order-1 lg:order-none flex flex-col">
            <div className="mb-4 lg:mb-6 px-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">New Invoice</h1>
              <p className="text-sm text-gray-500 mt-1">Create and send a new invoice to your customer.</p>
            </div>
            <InvoiceForm shopName={shopName} />
          </div>
          
          {/* Right Panel: Analytics & History */}
          <div className="lg:col-span-7 order-2 lg:order-none mt-8 lg:mt-0 flex flex-col">
            <div className="mb-4 lg:mb-6 px-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Recent Transactions</h1>
              <p className="text-sm text-gray-500 mt-1">Monitor your latest sales, payments, and trends.</p>
            </div>
            <InvoiceHistory />
          </div>

        </div>
      </main>
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
