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
    <div className="min-h-screen bg-white flex flex-col">
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
      <header className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-y-3 gap-x-2">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 px-2 sm:px-3 py-1.5 rounded-full hover:bg-gray-200 transition flex items-center gap-1 whitespace-nowrap"
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
            className="text-xs sm:text-sm text-gray-600 border border-gray-300 rounded px-2 sm:px-3 py-1.5 hover:bg-gray-50 whitespace-nowrap"
          >
            Inventory
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs sm:text-sm text-gray-600 border border-gray-300 rounded px-2 sm:px-3 py-1.5 hover:bg-gray-50 whitespace-nowrap"
            >
              Admin
            </Link>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{shopName || "Dashboard"}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs sm:text-sm text-gray-600 border border-gray-300 rounded px-2 sm:px-3 py-1.5 hover:bg-gray-50 whitespace-nowrap"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <InvoiceForm shopName={shopName} />
          </div>
          <div className="lg:col-span-3">
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
