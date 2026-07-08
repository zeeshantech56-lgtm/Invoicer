// src/components/ProtectedRoute.js
// Redirects unauthenticated visitors to /login before rendering children.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAccessStatus } from "@/lib/access";
import Logo from "@/components/Logo";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin, isBanned, userData } = useAuth();
  const { hasAccess, hasSubscribedBefore, isTrial, daysLeftTrial, daysLeftSub, isSubscribed, expiryDateString } = useAccessStatus(userData);
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (adminOnly && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, loading, isAdmin, adminOnly, router]);

  if (loading || !user || (adminOnly && !isAdmin)) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  if (isBanned && !adminOnly) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-red-200 text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">Account Suspended</h1>
          <p className="text-sm text-gray-600">
            {userData?.banReason || "Your access to the platform has been revoked by the administrator. If you believe this is a mistake, please contact support."}
          </p>
        </div>
      </div>
    );
  }

  // Hard Lock Screen if access expired
  if (!hasAccess && !adminOnly) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center border-t-4 border-red-500">
          <Logo size="lg" className="mx-auto mb-6 flex justify-center" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Expired</h1>
          <p className="text-gray-600 mb-6">
            {hasSubscribedBefore 
              ? "Your subscription has expired. Please choose a bundle to renew your plan." 
              : "Your 3-day free trial has ended. Please choose a bundle to continue using Invoicer."}
          </p>
          
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
          
          <p className="text-gray-500 text-xs mb-6">Message us on WhatsApp with your shop email ({user?.email}) after payment to instantly unlock your account.</p>
        </div>
      </div>
    );
  }

  return children;
}
