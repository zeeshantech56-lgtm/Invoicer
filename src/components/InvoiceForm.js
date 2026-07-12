// src/components/InvoiceForm.js
// Multi-product quick-entry invoice form. Writes to Firestore tagged with
// shopId, then opens WhatsApp pre-filled with a link to the public invoice page.

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { createInvoice, buildWhatsAppUrl } from "@/lib/invoices";
import { getUserProducts } from "@/lib/inventory";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calculateGstBreakdown } from "@/lib/gst";
import { INDIAN_STATES } from "@/lib/constants";

const emptyProduct = () => ({ name: "", qty: 1, price: "", productId: "", hsnCode: "", gstRate: "18" });

export default function InvoiceForm({ shopName }) {
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerStateCode, setCustomerStateCode] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [products, setProducts] = useState([emptyProduct()]);
  const [submitting, setSubmitting] = useState(false);
  const [customFooter, setCustomFooter] = useState("");
  const [frequentItems, setFrequentItems] = useState([]);
  
  const [shopProfile, setShopProfile] = useState(null);
  const [inventoryProducts, setInventoryProducts] = useState([]);

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

    if (user) {
      getUserProducts(user.uid).then(prods => setInventoryProducts(prods)).catch(console.error);
      getDoc(doc(db, "users", user.uid)).then(snap => {
        if (snap.exists()) setShopProfile(snap.data());
      }).catch(console.error);
    }
  }, [user]);

  // Derived calculations
  const isInterState = shopProfile?.stateCode && customerStateCode && shopProfile.stateCode !== customerStateCode;
  const hasGstin = !!shopProfile?.gstin;

  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalGst = 0;

  const calculatedProducts = products.map((p) => {
    const qty = Number(p.qty) || 0;
    const price = Number(p.price) || 0;
    const lineSubtotal = qty * price;
    let lineGst = { cgst: 0, sgst: 0, igst: 0, totalGst: 0 };
    
    if (hasGstin) {
      lineGst = calculateGstBreakdown(lineSubtotal, Number(p.gstRate) || 0, isInterState);
    }
    
    subtotal += lineSubtotal;
    totalCgst += lineGst.cgst;
    totalSgst += lineGst.sgst;
    totalIgst += lineGst.igst;
    totalGst += lineGst.totalGst;

    return { ...p, lineSubtotal, ...lineGst };
  });

  const grandTotal = subtotal + totalGst;

  const updateProduct = (index, field, value) => {
    setProducts((prev) =>
      prev.map((p, i) => {
        if (i === index) {
          const updated = { ...p, [field]: value };
          if (field === "name") {
            const matchedProduct = inventoryProducts.find(ip => ip.name.toLowerCase() === value.toLowerCase());
            if (matchedProduct) {
              if (!p.price || p.price === "" || p.price === "0" || p.price === 0) {
                updated.price = matchedProduct.price;
              }
              updated.productId = matchedProduct.id;
              updated.hsnCode = matchedProduct.hsnCode || "";
              updated.gstRate = matchedProduct.gstRate || "0";
            } else {
              updated.productId = "";
            }
          }
          return updated;
        }
        return p;
      })
    );
  };

  const addInventoryProduct = (invProduct) => {
    const existingIndex = products.findIndex(p => p.name.trim().toLowerCase() === invProduct.name.trim().toLowerCase());
    
    if (existingIndex !== -1) {
      setProducts(prev => prev.map((p, i) => i === existingIndex ? { ...p, qty: Number(p.qty) + 1 } : p));
      return;
    }

    const emptyIndex = products.findIndex(p => p.name.trim() === "" && (!p.price || p.price === "" || p.price === "0" || p.price === 0));
    
    const newP = { 
      name: invProduct.name, 
      qty: 1, 
      price: invProduct.price,
      productId: invProduct.id,
      hsnCode: invProduct.hsnCode || "",
      gstRate: invProduct.gstRate || "0"
    };

    if (emptyIndex !== -1) {
      setProducts(prev => prev.map((p, i) => i === emptyIndex ? newP : p));
    } else {
      setProducts(prev => [...prev, newP]);
    }
  };

  const addProductRow = () => setProducts((prev) => [...prev, emptyProduct()]);
  const removeProduct = (index) => setProducts((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerStateCode("");
    setCustomerGstin("");
    setProducts([emptyProduct()]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Client-side stock check
    for (const p of products) {
      if (p.productId) {
        const invItem = inventoryProducts.find(ip => ip.id === p.productId);
        if (invItem && (invItem.stockQty || 0) < p.qty) {
          alert(`Only ${invItem.stockQty || 0} units of ${p.name} available in stock.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const cleanProducts = calculatedProducts.map((p) => ({
        name: p.name,
        qty: Number(p.qty) || 0,
        price: Number(p.price) || 0,
        productId: p.productId || "",
        hsnCode: p.hsnCode || "",
        gstRate: Number(p.gstRate) || 0,
        lineSubtotal: p.lineSubtotal,
        cgst: p.cgst,
        sgst: p.sgst,
        igst: p.igst
      }));

      if (cleanProducts.some(p => p.qty <= 0 || p.price < 0)) {
        alert("Quantity must be greater than zero and price cannot be negative.");
        setSubmitting(false);
        return;
      }

      const newItems = new Set(frequentItems);
      cleanProducts.forEach(p => {
        if (p.name.trim()) newItems.add(p.name.trim());
      });
      const updatedItems = Array.from(newItems).slice(0, 50);
      setFrequentItems(updatedItems);
      localStorage.setItem("invoicer_frequent_items", JSON.stringify(updatedItems));
      localStorage.setItem("invoicer_custom_footer", customFooter);

      const fullPhone = "91" + customerPhone.replace(/\D/g, "");

      const { id, total: savedTotal } = await createInvoice({
        shopId: user.uid,
        shopName: shopProfile?.shopName || shopName || "My Shop",
        shopGstin: shopProfile?.gstin || "",
        shopStateCode: shopProfile?.stateCode || "",
        shopAddress: shopProfile?.businessAddress || "",
        customerName,
        customerPhone: fullPhone,
        customerStateCode,
        customerGstin,
        products: cleanProducts,
        isInterState,
        subtotal,
        totalCgst,
        totalSgst,
        totalIgst,
        totalGst,
        grandTotal
      });

      const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
      const waUrl = buildWhatsAppUrl({
        phone: fullPhone,
        shopName: shopProfile?.shopName || shopName || "My Shop",
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
        New Invoice
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp Number</label>
            <div className="flex rounded border border-gray-300 focus-within:ring-2 focus-within:ring-gray-900">
              <span className="inline-flex items-center px-2 sm:px-3 rounded-l border-r border-gray-300 bg-gray-50 text-gray-500 text-sm">
                +91
              </span>
              <input
                type="tel"
                placeholder="9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-r focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {hasGstin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Customer State (Required for GST)</label>
              <select
                value={customerStateCode}
                onChange={(e) => setCustomerStateCode(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                required
              >
                <option value="">Select state...</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Customer GSTIN (Optional B2B)</label>
              <input
                type="text"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 uppercase"
              />
            </div>
          </div>
        )}

        {inventoryProducts.length > 0 && (
          <div className="pt-2">
            <label className="block text-xs font-medium text-gray-600 mb-2">Quick Add from Inventory</label>
            <div className="flex flex-wrap gap-2">
              {inventoryProducts.map((ip) => (
                <button
                  key={ip.id}
                  type="button"
                  onClick={() => addInventoryProduct(ip)}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs py-1.5 px-3 rounded-full border border-gray-200 transition whitespace-nowrap"
                >
                  {ip.name} <span className="text-gray-400 ml-1">₹{ip.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <label className="block text-xs font-medium text-gray-600 mb-2">Products</label>
          <div className="hidden sm:flex gap-2 text-[11px] text-gray-400 mb-1">
            <span className="flex-1">Name</span>
            <span className="w-16">Qty</span>
            <span className="w-20">Rate</span>
            {hasGstin && <span className="w-16">GST %</span>}
            <span className="w-24 text-right">Total</span>
            <span className="w-8"></span>
          </div>
          <div className="space-y-3 sm:space-y-2">
            {products.map((p, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-center bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none border border-gray-100 sm:border-0">
                <div className="flex gap-2 w-full sm:flex-1">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={p.name}
                    list="frequent-items"
                    onChange={(e) => updateProduct(i, "name", e.target.value)}
                    className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeProduct(i)}
                    disabled={products.length === 1}
                    className="w-8 h-8 flex sm:hidden items-center justify-center text-gray-400 hover:text-red-600 disabled:opacity-30 bg-white rounded border border-gray-200"
                  >
                    ×
                  </button>
                </div>
                <div className="flex gap-2 items-center w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none sm:w-16 flex items-center gap-2 sm:gap-0">
                    <span className="text-[10px] text-gray-500 sm:hidden w-8">Qty</span>
                    <input
                      type="number"
                      min="1"
                      value={p.qty}
                      onChange={(e) => updateProduct(i, "qty", e.target.value)}
                      className="w-full sm:w-16 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                      required
                    />
                  </div>
                  <div className="flex-1 sm:flex-none sm:w-20 flex items-center gap-2 sm:gap-0">
                    <span className="text-[10px] text-gray-500 sm:hidden w-8">Rate</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={p.price}
                      onChange={(e) => updateProduct(i, "price", e.target.value)}
                      className="w-full sm:w-20 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                      required
                    />
                  </div>
                  {hasGstin && (
                    <div className="flex-1 sm:flex-none sm:w-16 flex items-center gap-2 sm:gap-0">
                      <span className="text-[10px] text-gray-500 sm:hidden w-8">GST</span>
                      <select
                        value={p.gstRate}
                        onChange={(e) => updateProduct(i, "gstRate", e.target.value)}
                        className="w-full sm:w-16 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                  )}
                  <div className="w-24 sm:w-24 sm:flex-none text-right text-sm font-medium text-gray-900 flex items-center justify-end">
                    ₹{((Number(p.qty) || 0) * (Number(p.price) || 0)).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(i)}
                    disabled={products.length === 1}
                    className="w-8 h-8 sm:flex-none hidden sm:flex items-center justify-center text-gray-400 hover:text-red-600 disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addProductRow}
            className="mt-3 w-full text-sm border border-dashed border-gray-300 rounded py-2 text-gray-500 hover:border-gray-400 hover:text-gray-700"
          >
            + Add another product
          </button>
          
          <datalist id="frequent-items">
            {inventoryProducts.map((p) => <option key={p.id} value={p.name} />)}
            {frequentItems.map((item, idx) => {
              if (inventoryProducts.some(p => p.name.toLowerCase() === item.toLowerCase())) return null;
              return <option key={`freq-${idx}`} value={item} />;
            })}
          </datalist>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-2">
          {hasGstin && (
            <>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Total GST</span>
                <span>₹{totalGst.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">Grand Total</span>
            <span className="text-xl font-semibold text-gray-900">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
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
