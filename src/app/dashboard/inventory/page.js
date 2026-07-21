"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import Logo from "@/components/Logo";
import { getUserProducts, addProduct, deleteProduct, updateProduct } from "@/lib/inventory";

function InventoryContent() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductHsn, setNewProductHsn] = useState("");
  const [newProductGst, setNewProductGst] = useState("18");
  const [newProductPurchasePrice, setNewProductPurchasePrice] = useState("");
  const [newProductStock, setNewProductStock] = useState("");
  const [newProductLowStock, setNewProductLowStock] = useState("10");
  const [newProductUnit, setNewProductUnit] = useState("pcs");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "", price: "", hsnCode: "", gstRate: "18", purchasePrice: "", stockQty: "", lowStockThreshold: "10", unit: "pcs"
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      if (!user) return;
      try {
        const userProducts = await getUserProducts(user.uid);
        setProducts(userProducts);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [user]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductName.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const added = await addProduct(user.uid, {
        name: newProductName,
        price: newProductPrice,
        hsnCode: newProductHsn,
        gstRate: newProductGst,
        purchasePrice: newProductPurchasePrice,
        stockQty: newProductStock,
        lowStockThreshold: newProductLowStock,
        unit: newProductUnit
      });
      setProducts([...products, added]);
      
      // Reset form
      setNewProductName("");
      setNewProductPrice("");
      setNewProductHsn("");
      setNewProductGst("18");
      setNewProductPurchasePrice("");
      setNewProductStock("");
      setNewProductLowStock("10");
      setNewProductUnit("pcs");
    } catch (err) {
      alert("Error adding product: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(user.uid, productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      alert("Error deleting product: " + err.message);
    }
  };

  const handleEditClick = (p) => {
    setEditingProductId(p.id);
    setEditForm({
      name: p.name || "",
      price: p.price || "",
      hsnCode: p.hsnCode || "",
      gstRate: p.gstRate || "18",
      purchasePrice: p.purchasePrice || "",
      stockQty: p.stockQty || "",
      lowStockThreshold: p.lowStockThreshold || "10",
      unit: p.unit || "pcs"
    });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  const handleUpdateProductSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !user || !editingProductId) return;

    setIsUpdating(true);
    try {
      await updateProduct(user.uid, editingProductId, editForm);
      setProducts(products.map(p => p.id === editingProductId ? { id: editingProductId, ...editForm } : p));
      setEditingProductId(null);
    } catch (err) {
      alert("Error updating product: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading inventory...</div>;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600 text-sm">Manage your product catalog, GST rates, and stock levels.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 border border-gray-200 rounded-lg p-6 h-fit">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Add New Product
            </h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Premium Widget"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={newProductHsn}
                    onChange={(e) => setNewProductHsn(e.target.value)}
                    placeholder="e.g. 8471"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">GST Rate (%)</label>
                  <select
                    value={newProductGst}
                    onChange={(e) => setNewProductGst(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProductPurchasePrice}
                    onChange={(e) => setNewProductPurchasePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    placeholder="pcs"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Low Alert</label>
                  <input
                    type="number"
                    min="0"
                    value={newProductLowStock}
                    onChange={(e) => setNewProductLowStock(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded hover:bg-gray-800 transition disabled:opacity-50 mt-4"
              >
                {isSubmitting ? "Adding..." : "Add Product"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 border border-gray-200 rounded-lg p-6 overflow-hidden flex flex-col">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Your Saved Products
            </h2>
            {products.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                No products added yet. Add one to get started!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-2 px-3 font-medium text-gray-600 rounded-tl">Name</th>
                      <th className="py-2 px-3 font-medium text-gray-600">HSN</th>
                      <th className="py-2 px-3 font-medium text-gray-600">GST</th>
                      <th className="py-2 px-3 font-medium text-gray-600 text-right">Price</th>
                      <th className="py-2 px-3 font-medium text-gray-600 text-right">Stock</th>
                      <th className="py-2 px-3 font-medium text-gray-600 text-right rounded-tr w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const stockQty = Number(p.stockQty) || 0;
                      const lowThreshold = Number(p.lowStockThreshold) || 10;
                      const isLowStock = stockQty <= lowThreshold;

                      if (editingProductId === p.id) {
                        return (
                          <tr key={p.id} className="border-b border-gray-100 bg-gray-50">
                            <td colSpan="6" className="py-3 px-3">
                              <form onSubmit={handleUpdateProductSubmit} className="flex gap-3 items-center flex-wrap sm:flex-nowrap">
                                <input type="text" required value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} placeholder="Name" className="border px-2 py-1.5 text-xs rounded w-full sm:w-32 focus:ring-1 focus:ring-gray-900" />
                                <input type="text" value={editForm.hsnCode} onChange={(e) => setEditForm({...editForm, hsnCode: e.target.value})} placeholder="HSN" className="border px-2 py-1.5 text-xs rounded w-full sm:w-20 focus:ring-1 focus:ring-gray-900" />
                                <select value={editForm.gstRate} onChange={(e) => setEditForm({...editForm, gstRate: e.target.value})} className="border px-2 py-1.5 text-xs rounded w-full sm:w-20 bg-white focus:ring-1 focus:ring-gray-900">
                                  <option value="0">0%</option>
                                  <option value="5">5%</option>
                                  <option value="12">12%</option>
                                  <option value="18">18%</option>
                                  <option value="28">28%</option>
                                </select>
                                <input type="number" min="0" step="0.01" required value={editForm.price} onChange={(e) => setEditForm({...editForm, price: e.target.value})} placeholder="Price" className="border px-2 py-1.5 text-xs rounded w-full sm:w-24 focus:ring-1 focus:ring-gray-900" />
                                <input type="number" min="0" value={editForm.stockQty} onChange={(e) => setEditForm({...editForm, stockQty: e.target.value})} placeholder="Stock" className="border px-2 py-1.5 text-xs rounded w-full sm:w-20 focus:ring-1 focus:ring-gray-900" />
                                <div className="flex gap-2 ml-auto w-full sm:w-auto justify-end mt-2 sm:mt-0">
                                  <button type="submit" disabled={isUpdating} className="text-white text-xs font-medium bg-gray-900 px-3 py-1.5 rounded hover:bg-gray-800 disabled:opacity-50">{isUpdating ? "Saving..." : "Save"}</button>
                                  <button type="button" onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-900 text-xs font-medium px-3 py-1.5 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                          <td className="py-3 px-3 text-gray-900">
                            {p.name}
                            {isLowStock && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">Low Stock</span>}
                          </td>
                          <td className="py-3 px-3 text-gray-600 text-xs">{p.hsnCode || "-"}</td>
                          <td className="py-3 px-3 text-gray-600 text-xs">{p.gstRate}%</td>
                          <td className="py-3 px-3 text-right text-gray-900">₹{Number(p.price).toFixed(2)}</td>
                          <td className={`py-3 px-3 text-right font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {stockQty} <span className="text-gray-500 text-xs font-normal">{p.unit}</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleEditClick(p)}
                                className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <ProtectedRoute>
      <InventoryContent />
    </ProtectedRoute>
  );
}
