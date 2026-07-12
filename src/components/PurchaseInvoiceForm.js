"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserProducts } from "@/lib/inventory";
import { createPurchaseInvoice } from "@/lib/purchases";
import { calculateGstBreakdown } from "@/lib/gst";

const emptyProduct = () => ({ name: "", qty: 1, purchasePrice: "", productId: "", hsnCode: "", gstRate: "18" });

export default function PurchaseInvoiceForm({ shopProfile, onPurchaseSaved }) {
  const { user } = useAuth();
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierGstin, setSupplierGstin] = useState("");
  const [products, setProducts] = useState([emptyProduct()]);
  const [submitting, setSubmitting] = useState(false);
  
  const [inventoryProducts, setInventoryProducts] = useState([]);

  useEffect(() => {
    if (user) {
      getUserProducts(user.uid).then(prods => setInventoryProducts(prods)).catch(console.error);
    }
  }, [user]);

  // Derived calculations
  const isInterState = shopProfile?.stateCode && supplierGstin && supplierGstin.slice(0, 2) !== shopProfile.stateCode;
  
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalGst = 0;

  const calculatedProducts = products.map((p) => {
    const qty = Number(p.qty) || 0;
    const price = Number(p.purchasePrice) || 0;
    const lineSubtotal = qty * price;
    
    const lineGst = calculateGstBreakdown(lineSubtotal, Number(p.gstRate) || 0, !!isInterState);
    
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
              updated.productId = matchedProduct.id;
              updated.hsnCode = matchedProduct.hsnCode || "";
              updated.gstRate = matchedProduct.gstRate || "0";
              if (!p.purchasePrice) updated.purchasePrice = matchedProduct.purchasePrice || "";
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

  const addProductRow = () => setProducts((prev) => [...prev, emptyProduct()]);
  const removeProduct = (index) => setProducts((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setSupplierName("");
    setSupplierPhone("");
    setSupplierGstin("");
    setProducts([emptyProduct()]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const cleanProducts = calculatedProducts.map((p) => ({
        name: p.name,
        qty: Number(p.qty) || 0,
        purchasePrice: Number(p.purchasePrice) || 0,
        productId: p.productId || "",
        hsnCode: p.hsnCode || "",
        gstRate: Number(p.gstRate) || 0,
        lineSubtotal: p.lineSubtotal,
        cgst: p.cgst,
        sgst: p.sgst,
        igst: p.igst
      }));

      if (cleanProducts.some(p => p.qty <= 0 || p.purchasePrice < 0)) {
        alert("Quantity must be greater than zero and price cannot be negative.");
        setSubmitting(false);
        return;
      }

      await createPurchaseInvoice({
        shopId: user.uid,
        supplierName,
        supplierPhone,
        supplierGstin,
        products: cleanProducts,
        isInterState: !!isInterState,
        subtotal,
        totalCgst,
        totalSgst,
        totalIgst,
        totalGst,
        grandTotal,
        createdBy: user.uid
      });

      alert("Purchase invoice saved successfully! Stock updated.");
      resetForm();
      if (onPurchaseSaved) onPurchaseSaved();
    } catch (err) {
      alert("Error saving purchase invoice: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
        Record New Purchase
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Supplier Name</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Supplier Phone</label>
            <input
              type="tel"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Supplier GSTIN (Optional)</label>
            <input
              type="text"
              value={supplierGstin}
              onChange={(e) => setSupplierGstin(e.target.value.toUpperCase())}
              placeholder="Optional"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 uppercase"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-medium text-gray-600 mb-2">Products Received</label>
          <div className="space-y-3">
            {products.map((p, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-200 relative">
                
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removeProduct(i)}
                  disabled={products.length === 1}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 disabled:opacity-30 bg-white rounded border border-gray-200 shadow-sm"
                  title="Remove item"
                >
                  ×
                </button>

                <div className="mb-3 pr-8">
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Item Name</label>
                  <input
                    type="text"
                    placeholder="Item name"
                    value={p.name}
                    list="inventory-items"
                    onChange={(e) => updateProduct(i, "name", e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white shadow-sm"
                    required
                  />
                </div>
                
                <div className="flex flex-wrap gap-3 mb-2">
                  <div className="flex-1 min-w-[60px]">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={p.qty}
                      onChange={(e) => updateProduct(i, "qty", e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white shadow-sm"
                      required
                    />
                  </div>
                  
                  <div className="flex-1 min-w-[80px]">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={p.purchasePrice}
                      onChange={(e) => updateProduct(i, "purchasePrice", e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white shadow-sm"
                      required
                    />
                  </div>
                  
                  <div className="flex-1 min-w-[70px]">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">GST %</label>
                    <select
                      value={p.gstRate}
                      onChange={(e) => updateProduct(i, "gstRate", e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white shadow-sm"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-200 mt-3 pt-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Line Total</span>
                  <div className="text-sm font-bold text-gray-900">
                    ₹{((Number(p.qty) || 0) * (Number(p.purchasePrice) || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addProductRow}
            className="mt-3 w-full text-sm border border-dashed border-gray-300 rounded py-2 text-gray-500 hover:border-gray-400 hover:text-gray-700"
          >
            + Add another item
          </button>
          
          <datalist id="inventory-items">
            {inventoryProducts.map((p) => <option key={p.id} value={p.name} />)}
          </datalist>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Total GST</span>
            <span>₹{totalGst.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">Grand Total</span>
            <span className="text-xl font-semibold text-gray-900">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Purchase & Update Stock"}
        </button>
      </form>
    </div>
  );
}
