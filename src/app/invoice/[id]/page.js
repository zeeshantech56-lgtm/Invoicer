// src/app/invoice/[id]/page.js
// Public, no-login invoice page. This is the link sent in the WhatsApp message.
// Firestore rules allow anyone to read a SINGLE invoice by ID, but never list all.

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getInvoiceById } from "@/lib/invoices";
import Logo from "@/components/Logo";

export default function PublicInvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const data = await getInvoiceById(params.id);
        if (!data) {
          setNotFound(true);
        } else {
          setInvoice(data);
        }
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading invoice...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Logo />
        <p className="mt-6 text-sm text-gray-500">
          This invoice could not be found. It may have been removed.
        </p>
      </div>
    );
  }

  // Error handling for missing or corrupt invoice data
  if (!invoice.products || invoice.products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Logo />
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-center">
          <p className="text-sm text-red-600 font-bold mb-1">Error: Corrupt Invoice Data</p>
          <p className="text-xs text-red-500">This invoice is missing required line items and cannot be generated.</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "";
    return timestamp.toDate().toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 print:bg-white print:p-0 print:m-0 print:block">
      <div className="max-w-md mx-auto invoice-container">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 print:shadow-none print:border-none print:p-0">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Invoice from</p>
              <p className="text-base font-semibold text-gray-900">{invoice.shopName || 'N/A'}</p>
            </div>
            <p className="text-xs text-gray-400">{formatDate(invoice.timestamp)}</p>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Billed to</p>
            <p className="text-sm font-medium text-gray-900">{invoice.customerName || 'N/A'}</p>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.products || []).map((p, i) => {
                const qty = Number(p.qty) || 0;
                const price = Number(p.price) || 0;
                return (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-900">{p.name || 'Unknown Item'}</td>
                    <td className="py-2 text-center text-gray-600">{qty}</td>
                    <td className="py-2 text-right text-gray-600">₹{price.toFixed(2)}</td>
                    <td className="py-2 text-right text-gray-900 font-medium">
                      ₹{(qty * price).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="text-sm font-medium text-gray-500">Total</span>
            <span className="text-xl font-semibold text-gray-900">
              ₹{Number(invoice.total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by Invoicer
        </p>
      </div>
    </div>
  );
}
