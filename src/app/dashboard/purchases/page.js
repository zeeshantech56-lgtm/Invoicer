"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import Logo from "@/components/Logo";
import PurchaseInvoiceForm from "@/components/PurchaseInvoiceForm";
import { getPurchaseInvoices } from "@/lib/purchases";

function PurchasesContent() {
  const { user } = useAuth();
  const [shopProfile, setShopProfile] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    if (!user) return;
    try {
      const data = await getPurchaseInvoices(user.uid);
      setInvoices(data);
    } catch (err) {
      console.error("Error fetching purchases:", err);
    }
  };

  useEffect(() => {
    async function loadInitialData() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setShopProfile(snap.data());
        await fetchPurchases();
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "";
    return timestamp.toDate().toLocaleString();
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading purchases...</div>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 px-2 sm:px-3 py-1.5 rounded-full hover:bg-gray-200 transition flex items-center gap-1"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Invoices</h1>
          <p className="text-gray-600 text-sm">Record stock purchases from suppliers. Stock quantities are automatically updated.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <PurchaseInvoiceForm shopProfile={shopProfile} onPurchaseSaved={fetchPurchases} />
          </div>
          <div className="lg:col-span-3">
            <div className="border border-gray-200 rounded-lg p-6 bg-white h-full">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Purchase History
              </h2>
              
              {invoices.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  No purchases recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase">
                        <th className="pb-2 pr-4">Supplier</th>
                        <th className="pb-2 pr-4">Items</th>
                        <th className="pb-2 pr-4">Total</th>
                        <th className="pb-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4 font-medium text-gray-900">
                            {inv.supplierName}
                          </td>
                          <td className="py-2 pr-4 text-gray-600 max-w-xs truncate">
                            {(inv.products || []).map((p) => `${p.qty}x ${p.name}`).join(", ")}
                          </td>
                          <td className="py-2 pr-4 text-gray-900 font-medium">
                            ₹{Number(inv.grandTotal || 0).toFixed(2)}
                          </td>
                          <td className="py-2 text-gray-500 text-xs">
                            {formatDate(inv.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PurchasesPage() {
  return (
    <ProtectedRoute>
      <PurchasesContent />
    </ProtectedRoute>
  );
}
