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
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Delete
                            </button>
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
