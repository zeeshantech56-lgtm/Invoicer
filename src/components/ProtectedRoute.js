// src/components/ProtectedRoute.js
// Redirects unauthenticated visitors to /login before rendering children.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin, isBanned } = useAuth();
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
            Your access to the platform has been revoked by the administrator. 
            If you believe this is a mistake, please contact support.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
