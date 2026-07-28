"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getUserProducts, addProduct, deleteProduct, updateProduct } from "@/lib/inventory";

// ── Shared input styles ───────────────────────────────────────────────────────
const inputCls = "w-full h-11 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-3.5 text-sm font-medium transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none hover:border-slate-300";
const selectCls = inputCls + " appearance-none";

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="flex gap-1 text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
        {label}
        {hint && <span className="font-normal text-slate-400 normal-case tracking-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function PageShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-500/40">
                <span className="text-white font-black text-sm">I</span>
              </div>
              <span className="font-bold text-slate-900 text-base tracking-tight hidden sm:block">Invoicer</span>
            </Link>
            <div className="flex-1" />
            <Link href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 px-4 py-2 rounded-xl transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ── Page header ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
function InventoryContent() {
  const { user } = useAuth();
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [newProductName, setNewProductName]           = useState("");
  const [newProductPrice, setNewProductPrice]         = useState("");
  const [newProductHsn, setNewProductHsn]             = useState("");
  const [newProductGst, setNewProductGst]             = useState("18");
  const [newProductPurchasePrice, setNewProductPurchasePrice] = useState("");
  const [newProductStock, setNewProductStock]         = useState("");
  const [newProductLowStock, setNewProductLowStock]   = useState("10");
  const [newProductUnit, setNewProductUnit]           = useState("pcs");
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm]           = useState({ name:"", price:"", hsnCode:"", gstRate:"18", purchasePrice:"", stockQty:"", lowStockThreshold:"10", unit:"pcs" });
  const [isUpdating, setIsUpdating]       = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserProducts(user.uid).then(p => setProducts(p)).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const handleAddProduct = async e => {
    e.preventDefault();
    if (!newProductName.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const added = await addProduct(user.uid, { name: newProductName, price: newProductPrice, hsnCode: newProductHsn, gstRate: newProductGst, purchasePrice: newProductPurchasePrice, stockQty: newProductStock, lowStockThreshold: newProductLowStock, unit: newProductUnit });
      setProducts([...products, added]);
      setNewProductName(""); setNewProductPrice(""); setNewProductHsn(""); setNewProductGst("18"); setNewProductPurchasePrice(""); setNewProductStock(""); setNewProductLowStock("10"); setNewProductUnit("pcs");
    } catch (err) { alert("Error adding product: " + err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteProduct = async id => {
    if (!confirm("Delete this product?")) return;
    try { await deleteProduct(user.uid, id); setProducts(products.filter(p => p.id !== id)); }
    catch (err) { alert("Error: " + err.message); }
  };

  const handleEditClick = p => { setEditingProductId(p.id); setEditForm({ name: p.name||"", price: p.price||"", hsnCode: p.hsnCode||"", gstRate: p.gstRate||"18", purchasePrice: p.purchasePrice||"", stockQty: p.stockQty||"", lowStockThreshold: p.lowStockThreshold||"10", unit: p.unit||"pcs" }); };

  const handleUpdateProductSubmit = async e => {
    e.preventDefault();
    if (!editForm.name.trim() || !user || !editingProductId) return;
    setIsUpdating(true);
    try { await updateProduct(user.uid, editingProductId, editForm); setProducts(products.map(p => p.id === editingProductId ? { id: editingProductId, ...editForm } : p)); setEditingProductId(null); }
    catch (err) { alert("Error: " + err.message); }
    finally { setIsUpdating(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading inventory…</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell title="Inventory Management" subtitle="Manage your product catalogue, prices, GST rates, and stock levels.">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* ── Add product form ── */}
        <div className="lg:col-span-4">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Add New Product</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in the details to add to your catalogue.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <form onSubmit={handleAddProduct} className="p-5 sm:p-6 space-y-4">
              <Field label="Product Name">
                <input type="text" required value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="e.g. Blue Denim Jeans" className={inputCls} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="HSN Code" hint="(Optional)">
                  <input type="text" value={newProductHsn} onChange={e => setNewProductHsn(e.target.value)} placeholder="e.g. 6203" className={inputCls} />
                </Field>
                <Field label="GST Rate">
                  <div className="relative">
                    <select value={newProductGst} onChange={e => setNewProductGst(e.target.value)} className={selectCls}>
                      {["0","5","12","18","28"].map(v => <option key={v} value={v}>{v}%</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Selling Price (₹)">
                  <input type="number" min="0" step="0.01" required value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Purchase Price (₹)" hint="(Optional)">
                  <input type="number" min="0" step="0.01" value={newProductPurchasePrice} onChange={e => setNewProductPurchasePrice(e.target.value)} placeholder="0.00" className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Stock">
                  <input type="number" min="0" value={newProductStock} onChange={e => setNewProductStock(e.target.value)} placeholder="0" className={inputCls} />
                </Field>
                <Field label="Unit">
                  <input type="text" value={newProductUnit} onChange={e => setNewProductUnit(e.target.value)} placeholder="pcs" className={inputCls} />
                </Field>
                <Field label="Low Alert">
                  <input type="number" min="0" value={newProductLowStock} onChange={e => setNewProductLowStock(e.target.value)} className={inputCls} />
                </Field>
              </div>

              <button type="submit" disabled={isSubmitting}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 mt-2">
                {isSubmitting ? "Adding…" : "+ Add Product"}
              </button>
            </form>
          </div>
        </div>

        {/* ── Product list ── */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Products</h2>
              <p className="text-xs text-slate-500 mt-0.5">{products.length} product{products.length !== 1 ? "s" : ""} in catalogue</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl mb-3">📦</div>
                <p className="font-bold text-slate-700 text-sm">No products yet</p>
                <p className="text-slate-400 text-xs mt-1">Add your first product using the form on the left.</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {["Product","HSN","GST","Sell Price","Stock","Actions"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {products.map(p => {
                        const stockQty = Number(p.stockQty) || 0;
                        const isLow = stockQty <= (Number(p.lowStockThreshold) || 10);

                        if (editingProductId === p.id) {
                          return (
                            <tr key={p.id} className="bg-indigo-50/50 border-b border-indigo-100">
                              <td colSpan={6} className="px-5 py-4">
                                <form onSubmit={handleUpdateProductSubmit} className="flex flex-wrap gap-2 items-center">
                                  <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Name" className="h-9 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 w-32 min-w-0" />
                                  <input type="text" value={editForm.hsnCode} onChange={e => setEditForm({...editForm, hsnCode: e.target.value})} placeholder="HSN" className="h-9 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 w-20 min-w-0" />
                                  <select value={editForm.gstRate} onChange={e => setEditForm({...editForm, gstRate: e.target.value})} className="h-9 bg-white border border-slate-200 rounded-lg px-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 w-18 min-w-0">
                                    {["0","5","12","18","28"].map(v => <option key={v} value={v}>{v}%</option>)}
                                  </select>
                                  <input type="number" min="0" step="0.01" required value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} placeholder="Price" className="h-9 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 w-24 min-w-0" />
                                  <input type="number" min="0" value={editForm.stockQty} onChange={e => setEditForm({...editForm, stockQty: e.target.value})} placeholder="Stock" className="h-9 bg-white border border-slate-200 rounded-lg px-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 w-20 min-w-0" />
                                  <div className="flex gap-2 ml-auto">
                                    <button type="submit" disabled={isUpdating} className="h-9 px-4 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">{isUpdating ? "Saving…" : "Save"}</button>
                                    <button type="button" onClick={() => setEditingProductId(null)} className="h-9 px-4 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition">Cancel</button>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={p.id} className={`hover:bg-slate-50/70 transition-colors ${isLow ? "bg-rose-50/40" : ""}`}>
                            <td className="px-5 py-3.5">
                              <span className="font-semibold text-slate-900 text-sm">{p.name}</span>
                              {isLow && <span className="ml-2 bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">Low Stock</span>}
                            </td>
                            <td className="px-5 py-3.5 text-slate-500 text-xs">{p.hsnCode || "—"}</td>
                            <td className="px-5 py-3.5 text-slate-500 text-xs">{p.gstRate}%</td>
                            <td className="px-5 py-3.5 font-bold text-slate-900">₹{Number(p.price).toFixed(2)}</td>
                            <td className={`px-5 py-3.5 font-bold text-sm ${isLow ? "text-rose-600" : "text-slate-900"}`}>
                              {stockQty} <span className="text-slate-400 text-xs font-normal">{p.unit}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <button onClick={() => handleEditClick(p)} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold transition">Edit</button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="text-rose-500 hover:text-rose-700 text-xs font-bold transition">Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden divide-y divide-slate-100">
                  {products.map(p => {
                    const stockQty = Number(p.stockQty) || 0;
                    const isLow = stockQty <= (Number(p.lowStockThreshold) || 10);
                    return (
                      <div key={p.id} className={`px-4 py-4 ${isLow ? "bg-rose-50/40" : ""}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                            {isLow && <span className="ml-2 bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">Low Stock</span>}
                            <p className="text-xs text-slate-500 mt-0.5">HSN: {p.hsnCode || "—"} · GST: {p.gstRate}%</p>
                          </div>
                          <span className="font-extrabold text-slate-900">₹{Number(p.price).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${isLow ? "text-rose-600" : "text-slate-700"}`}>{stockQty} {p.unit}</span>
                          <div className="flex gap-3">
                            <button onClick={() => handleEditClick(p)} className="text-indigo-600 text-xs font-bold">Edit</button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="text-rose-500 text-xs font-bold">Delete</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default function InventoryPage() {
  return <ProtectedRoute><InventoryContent /></ProtectedRoute>;
}
