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

  const hasGstin = !!invoice.shopGstin;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 print:bg-white print:p-0 print:m-0 print:block">
      <div className="max-w-3xl mx-auto invoice-container">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 print:shadow-none print:border-none print:p-0">
          <div className="flex justify-between border-b border-gray-100 pb-6 mb-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Invoice From</p>
              <p className="text-lg font-semibold text-gray-900">{invoice.shopName || 'N/A'}</p>
              {invoice.shopAddress && <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{invoice.shopAddress}</p>}
              {invoice.shopGstin && <p className="text-sm text-gray-600 mt-1">GSTIN: {invoice.shopGstin}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Invoice #</p>
              <p className="text-sm font-medium text-gray-900">{invoice.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wide mt-4">Date</p>
              <p className="text-sm text-gray-600">{formatDate(invoice.timestamp)}</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Billed To</p>
            <p className="text-sm font-medium text-gray-900">{invoice.customerName || 'N/A'}</p>
            {invoice.customerPhone && <p className="text-sm text-gray-600">+{invoice.customerPhone}</p>}
            {invoice.customerGstin && <p className="text-sm text-gray-600 mt-1">GSTIN: {invoice.customerGstin}</p>}
            {invoice.customerStateCode && <p className="text-sm text-gray-600">State Code: {invoice.customerStateCode}</p>}
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="pb-2">Item</th>
                {hasGstin && <th className="pb-2">HSN</th>}
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Price</th>
                {hasGstin && <th className="pb-2 text-right">GST %</th>}
                {hasGstin && <th className="pb-2 text-right">GST Amt</th>}
                <th className="pb-2 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.products || []).map((p, i) => {
                const qty = Number(p.qty) || 0;
                const price = Number(p.price) || 0;
                const lineTotal = qty * price + (p.totalGst || 0); // Need to decide if price is inclusive or exclusive. Standard B2B is exclusive. We calculate subtotal = qty*price, so lineTotal = qty*price + totalGst. Wait, previous was (qty * price). Let's use lineSubtotal + totalGst.
                const lineSubtotal = qty * price;
                return (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-3 text-gray-900">{p.name || 'Unknown Item'}</td>
                    {hasGstin && <td className="py-3 text-gray-600">{p.hsnCode || '-'}</td>}
                    <td className="py-3 text-center text-gray-600">{qty}</td>
                    <td className="py-3 text-right text-gray-600">₹{price.toFixed(2)}</td>
                    {hasGstin && <td className="py-3 text-right text-gray-600">{p.gstRate || 0}%</td>}
                    {hasGstin && <td className="py-3 text-right text-gray-600">₹{(p.totalGst || 0).toFixed(2)}</td>}
                    <td className="py-3 text-right text-gray-900 font-medium">
                      ₹{hasGstin ? (lineSubtotal + (p.totalGst || 0)).toFixed(2) : lineSubtotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {hasGstin ? (
            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{(invoice.subtotal || 0).toFixed(2)}</span>
                </div>
                {invoice.isInterState ? (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>IGST</span>
                    <span>₹{(invoice.totalIgst || 0).toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>CGST</span>
                      <span>₹{(invoice.totalCgst || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>SGST</span>
                      <span>₹{(invoice.totalSgst || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                  <span>Grand Total</span>
                  <span>₹{(invoice.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{(invoice.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                  <span>Grand Total</span>
                  <span>₹{(invoice.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {invoice.paymentStatus && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Payment Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                  ${invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                    invoice.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {invoice.paymentStatus}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Amount Paid</p>
                <p className="text-sm font-medium text-gray-900">₹{(invoice.amountPaid || 0).toFixed(2)}</p>
              </div>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-gray-400 mt-6 print:hidden">
          Powered by Invoicer
        </p>
      </div>
    </div>
  );
}
