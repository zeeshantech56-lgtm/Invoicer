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

  const now = Date.now();
  const createdAt = userData?.createdAt?.toMillis() || now;
  const trialEnd = createdAt + (72 * 60 * 60 * 1000); // 72 hours
  const isTrial = now < trialEnd;
  const subUntil = userData?.subscriptionUntil?.toMillis() || null;
  const isSubscribed = subUntil && now < subUntil;
  const hasAccess = isTrial || isSubscribed;
  
  const hasSubscribedBefore = !!userData?.hasSubscribedBefore;
  
  const daysLeftTrial = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
  const daysLeftSub = subUntil ? Math.ceil((subUntil - now) / (1000 * 60 * 60 * 24)) : 0;
  
  const subUntilDate = userData?.subscriptionUntil?.toDate ? userData.subscriptionUntil.toDate() : (subUntil ? new Date(subUntil) : null);
  const expiryDateString = subUntilDate ? subUntilDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "";

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  // Hard Lock Screen if access expired
  if (!hasAccess && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center border-t-4 border-red-500">
          <Logo size="lg" className="mx-auto mb-6 flex justify-center" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Expired</h1>
          {userData?.banReason ? (
            <p className="text-sm text-gray-900 mb-6 bg-red-50 p-3 rounded border border-red-100">
              {userData.banReason}
            </p>
          ) : (
            <p className="text-gray-600 mb-6">
              {hasSubscribedBefore 
                ? "Your subscription has expired. Please choose a bundle to renew your plan." 
                : "Your 3-day free trial has ended. Please choose a bundle to continue using Invoicer."}
            </p>
          )}
          
          {!userData?.banReason && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6 text-left text-sm text-gray-800">
              <p className="font-semibold text-gray-900 mb-3 border-b pb-2">Select your bundle & pay via UPI:</p>
              <ul className="space-y-2 mb-4">
                <li className="flex justify-between"><span>1 Month:</span> <strong>₹{hasSubscribedBefore ? "300" : "500"}</strong></li>
                <li className="flex justify-between"><span>3 Months:</span> <strong>₹1,000</strong></li>
                <li className="flex justify-between text-blue-700 bg-blue-50 px-2 py-1 rounded -mx-2 font-medium">
                  <span>6 Months (Recommended):</span> <strong>₹1,800</strong>
                </li>
                <li className="flex justify-between"><span>1 Year:</span> <strong>₹3,000</strong></li>
              </ul>
              <div className="mt-4 border-t pt-4 text-center">
                <p className="mb-2 text-xs text-gray-500 uppercase tracking-wider font-semibold">UPI Number</p>
                <span className="text-2xl tracking-widest font-mono font-bold text-green-700 block">9202216517</span>
              </div>
            </div>
          )}
          
          <p className="text-gray-500 text-xs mb-6">Message us on WhatsApp with your shop email ({user?.email}) after payment to instantly unlock your account.</p>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900 underline">
            Sign out
          </button>
        </div>
      </div>
    );
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
