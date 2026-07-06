// src/components/InvoiceForm.js
// Multi-product quick-entry invoice form. Writes to Firestore tagged with
// shopId, then opens WhatsApp pre-filled with a link to the public invoice page.

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { createInvoice, buildWhatsAppUrl } from "@/lib/invoices";

const emptyProduct = () => ({ name: "", qty: 1, price: "" });

export default function InvoiceForm({ shopName }) {
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [products, setProducts] = useState([emptyProduct()]);
  const [submitting, setSubmitting] = useState(false);
  const [customFooter, setCustomFooter] = useState("");
  const [frequentItems, setFrequentItems] = useState([]);

  useEffect(() => {
    // Load saved preferences on mount
    const savedFooter = localStorage.getItem("invoicer_custom_footer");
    if (savedFooter) setCustomFooter(savedFooter);

    const savedItems = localStorage.getItem("invoicer_frequent_items");
    if (savedItems) {
      try {
        setFrequentItems(JSON.parse(savedItems));
      } catch (e) {}
    }
  }, []);

  const total = products.reduce(
    (sum, p) => sum + (Number(p.qty) || 0) * (Number(p.price) || 0),
    0
  );

  const updateProduct = (index, field, value) => {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const addProduct = () => setProducts((prev) => [...prev, emptyProduct()]);
  const removeProduct = (index) =>
    setProducts((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setProducts([emptyProduct()]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const cleanProducts = products.map((p) => ({
        name: p.name,
        qty: Number(p.qty) || 0,
        price: Number(p.price) || 0,
      }));

      // Update frequent items in local storage
      const newItems = new Set(frequentItems);
      cleanProducts.forEach(p => {
        if (p.name.trim()) newItems.add(p.name.trim());
      });
      const updatedItems = Array.from(newItems).slice(0, 50); // Keep max 50
      setFrequentItems(updatedItems);
      localStorage.setItem("invoicer_frequent_items", JSON.stringify(updatedItems));
      localStorage.setItem("invoicer_custom_footer", customFooter);

      const { id, total: savedTotal } = await createInvoice({
        shopId: user.uid, // <-- critical multi-tenant key
        shopName: shopName || "My Shop",
        customerName,
        customerPhone,
        products: cleanProducts,
      });

      const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
      const waUrl = buildWhatsAppUrl({
        phone: customerPhone,
        shopName: shopName || "My Shop",
        customerName,
        products: cleanProducts,
        total: savedTotal,
        invoiceId: id,
        siteUrl,
        customFooter
      });

      window.open(waUrl, "_blank");
      resetForm();
    } catch (err) {
      alert("Error saving invoice: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
        New invoice
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Customer name
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            WhatsApp number (with country code)
          </label>
          <input
            type="tel"
            placeholder="e.g. 919876543210"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Products
          </label>
          <div className="grid grid-cols-[1fr_56px_80px_28px] gap-2 text-[11px] text-gray-400 mb-1">
            <span>Name</span>
            <span>Qty</span>
            <span>Price</span>
            <span></span>
          </div>
          <div className="space-y-2">
            {products.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_56px_80px_28px] gap-2 items-center">
                <input
                  type="text"
                  placeholder="Milk"
                  value={p.name}
                  list="frequent-items"
                  onChange={(e) => updateProduct(i, "name", e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <input
                  type="number"
                  min="1"
                  value={p.qty}
                  onChange={(e) => updateProduct(i, "qty", e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={p.price}
                  onChange={(e) => updateProduct(i, "price", e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeProduct(i)}
                  disabled={products.length === 1}
                  className="h-8 w-7 flex items-center justify-center text-gray-400 hover:text-red-600 disabled:opacity-30"
                  aria-label="Remove product"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addProduct}
            className="mt-2 w-full text-sm border border-dashed border-gray-300 rounded py-1.5 text-gray-500 hover:border-gray-400 hover:text-gray-700"
          >
            + Add another product
          </button>
          
          <datalist id="frequent-items">
            {frequentItems.map((item, idx) => (
              <option key={idx} value={item} />
            ))}
          </datalist>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <span className="text-sm text-gray-500">Total amount</span>
          <span className="text-xl font-semibold text-gray-900">
            ₹{total.toFixed(2)}
          </span>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom WhatsApp Footer (Optional)
          </label>
          <textarea
            placeholder="e.g. Thanks for shopping! Follow us on Insta."
            value={customFooter}
            onChange={(e) => setCustomFooter(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y min-h-[80px]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-green-600 text-white text-sm font-medium py-2.5 rounded hover:bg-green-700 transition disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save and send via WhatsApp"}
        </button>
      </form>
    </div>
  );
}
