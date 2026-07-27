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
import { validatePaymentMode } from "@/lib/paymentHelpers";

const emptyProduct = () => ({ name: "", qty: 1, price: "", productId: "", hsnCode: "", gstRate: "18" });

// ── Reusable form field wrappers ─────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
      {children}{required && <span className="text-rose-400 ml-1">*</span>}
    </label>
  );
}
function Input(props) {
  return (
    <input
      {...props}
      className={`w-full bg-[#161b22] border border-white/10 text-white placeholder-slate-600
        rounded-xl px-4 py-3 text-sm transition focus:border-indigo-500 focus:ring-0 focus:bg-[#1c2330]
        ${props.className || ""}`}
    />
  );
}
function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full bg-[#161b22] border border-white/10 text-white
        rounded-xl px-4 py-3 text-sm transition focus:border-indigo-500 focus:ring-0 focus:bg-[#1c2330]
        ${props.className || ""}`}
    >
      {children}
    </select>
  );
}

// ── Section divider ──────────────────────────────────────────────────────────
function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-white/6" />
      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-white/6" />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function InvoiceForm({ shopName }) {
  const { user } = useAuth();
  const [customerName, setCustomerName]       = useState("");
  const [customerPhone, setCustomerPhone]     = useState("");
  const [customerStateCode, setCustomerStateCode] = useState("");
  const [customerGstin, setCustomerGstin]     = useState("");
  const [products, setProducts]               = useState([emptyProduct()]);
  const [submitting, setSubmitting]           = useState(false);
  const [customFooter, setCustomFooter]       = useState("");
  const [frequentItems, setFrequentItems]     = useState([]);
  const [paymentStatus, setPaymentStatus]     = useState("paid");
  const [amountPaid, setAmountPaid]           = useState("");
  const [discountAmount, setDiscountAmount]   = useState(0);
  const [paymentMode, setPaymentMode]         = useState("Cash");
  const [cashAmount, setCashAmount]           = useState("");
  const [onlineAmount, setOnlineAmount]       = useState("");
  const [shopProfile, setShopProfile]         = useState(null);
  const [inventoryProducts, setInventoryProducts] = useState([]);

  useEffect(() => {
    const savedFooter = localStorage.getItem("invoicer_custom_footer");
    if (savedFooter) setCustomFooter(savedFooter);
    const savedItems = localStorage.getItem("invoicer_frequent_items");
    if (savedItems) { try { setFrequentItems(JSON.parse(savedItems)); } catch (e) {} }
    if (user) {
      getUserProducts(user.uid).then(prods => setInventoryProducts(prods)).catch(console.error);
      getDoc(doc(db, "users", user.uid)).then(snap => {
        if (snap.exists()) setShopProfile(snap.data());
      }).catch(console.error);
    }
  }, [user]);

  // ── Calculations ────────────────────────────────────────────────────────
  const isInterState = shopProfile?.stateCode && customerStateCode && shopProfile.stateCode !== customerStateCode;
  const hasGstin     = !!shopProfile?.gstin;
  let subtotal = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0, totalGst = 0;

  const calculatedProducts = products.map(p => {
    const qty          = Number(p.qty) || 0;
    const price        = Number(p.price) || 0;
    const lineSubtotal = qty * price;
    let lineGst        = { cgst: 0, sgst: 0, igst: 0, totalGst: 0 };
    if (hasGstin) lineGst = calculateGstBreakdown(lineSubtotal, Number(p.gstRate) || 0, isInterState);
    subtotal    += lineSubtotal;
    totalCgst   += lineGst.cgst;
    totalSgst   += lineGst.sgst;
    totalIgst   += lineGst.igst;
    totalGst    += lineGst.totalGst;
    return { ...p, lineSubtotal, ...lineGst };
  });

  const grandTotal  = subtotal + totalGst;
  const finalAmount = Math.max(0, grandTotal - (Number(discountAmount) || 0));

  useEffect(() => {
    if (paymentMode === "Cash")   { setCashAmount(finalAmount.toFixed(2)); setOnlineAmount("0"); }
    else if (paymentMode === "Online") { setCashAmount("0"); setOnlineAmount(finalAmount.toFixed(2)); }
  }, [paymentMode, finalAmount]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const updateProduct = (index, field, value) => {
    setProducts(prev => prev.map((p, i) => {
      if (i !== index) return p;
      const updated = { ...p, [field]: value };
      if (field === "name") {
        const match = inventoryProducts.find(ip => ip.name.toLowerCase() === value.toLowerCase());
        if (match) {
          if (!p.price || p.price === "" || p.price === "0" || p.price === 0) updated.price = match.price;
          updated.productId = match.id;
          updated.hsnCode   = match.hsnCode || "";
          updated.gstRate   = match.gstRate  || "0";
        } else { updated.productId = ""; }
      }
      return updated;
    }));
  };

  const addInventoryProduct = invProduct => {
    const existingIndex = products.findIndex(p => p.name.trim().toLowerCase() === invProduct.name.trim().toLowerCase());
    if (existingIndex !== -1) {
      setProducts(prev => prev.map((p, i) => i === existingIndex ? { ...p, qty: Number(p.qty) + 1 } : p));
      return;
    }
    const emptyIndex = products.findIndex(p => p.name.trim() === "" && (!p.price || p.price === "" || p.price === "0" || p.price === 0));
    const newP = { name: invProduct.name, qty: 1, price: invProduct.price, productId: invProduct.id, hsnCode: invProduct.hsnCode || "", gstRate: invProduct.gstRate || "0" };
    if (emptyIndex !== -1) setProducts(prev => prev.map((p, i) => i === emptyIndex ? newP : p));
    else setProducts(prev => [...prev, newP]);
  };

  const addProductRow  = () => setProducts(prev => [...prev, emptyProduct()]);
  const removeProduct  = index => setProducts(prev => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setCustomerName(""); setCustomerPhone(""); setCustomerStateCode(""); setCustomerGstin("");
    setProducts([emptyProduct()]); setDiscountAmount(0); setPaymentMode("Cash");
    setCashAmount(""); setOnlineAmount("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user) return;
    for (const p of products) {
      if (p.productId) {
        const invItem = inventoryProducts.find(ip => ip.id === p.productId);
        if (invItem && (invItem.stockQty || 0) < p.qty) {
          alert(`Only ${invItem.stockQty || 0} units of ${p.name} available.`); return;
        }
      }
    }
    setSubmitting(true);
    try {
      const cleanProducts = calculatedProducts.map(p => ({
        name: p.name, qty: Number(p.qty) || 0, price: Number(p.price) || 0,
        productId: p.productId || "", hsnCode: p.hsnCode || "",
        gstRate: Number(p.gstRate) || 0, lineSubtotal: p.lineSubtotal,
        cgst: p.cgst, sgst: p.sgst, igst: p.igst, totalGst: p.totalGst,
      }));
      if (cleanProducts.some(p => p.qty <= 0 || p.price < 0)) {
        alert("Quantity must be > 0 and price cannot be negative."); setSubmitting(false); return;
      }
      const numDiscount = Number(discountAmount) || 0;
      if (numDiscount > grandTotal) {
        alert("Discount cannot exceed Grand Total."); setSubmitting(false); return;
      }
      const cash = Number(cashAmount) || 0;
      const online = Number(onlineAmount) || 0;
      const validation = validatePaymentMode(paymentMode, cash, online, finalAmount);
      if (!validation.valid) { alert(validation.error); setSubmitting(false); return; }

      const newItems = new Set(frequentItems);
      cleanProducts.forEach(p => { if (p.name.trim()) newItems.add(p.name.trim()); });
      const updatedItems = Array.from(newItems).slice(0, 50);
      setFrequentItems(updatedItems);
      localStorage.setItem("invoicer_frequent_items", JSON.stringify(updatedItems));
      localStorage.setItem("invoicer_custom_footer", customFooter);

      const rawPhone  = customerPhone.replace(/\D/g, "");
      const fullPhone = rawPhone ? "91" + rawPhone : "";

      const { id, total: savedTotal } = await createInvoice({
        shopId: user.uid, shopName: shopProfile?.shopName || shopName || "My Shop",
        shopGstin: shopProfile?.gstin || "", shopStateCode: shopProfile?.stateCode || "",
        shopAddress: shopProfile?.businessAddress || "",
        customerName, customerPhone: fullPhone, customerStateCode, customerGstin,
        products: cleanProducts, isInterState,
        subtotal, totalCgst, totalSgst, totalIgst, totalGst, grandTotal,
        discountAmount: numDiscount, finalAmount, paymentStatus,
        amountPaid: paymentStatus === "paid" ? finalAmount : (paymentStatus === "unpaid" ? 0 : amountPaid),
        paymentMode, cashAmount: cash, onlineAmount: online,
      });

      if (fullPhone && rawPhone.length >= 10) {
        const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
        const waUrl   = buildWhatsAppUrl({
          phone: fullPhone, shopName: shopProfile?.shopName || shopName || "My Shop",
          customerName, products: cleanProducts, total: savedTotal,
          invoiceId: id, siteUrl, customFooter, paymentStatus,
          amountPaid: paymentStatus === "paid" ? finalAmount : (paymentStatus === "unpaid" ? 0 : amountPaid),
        });
        window.open(waUrl, "_blank");
      } else { alert("Invoice saved successfully!"); }
      resetForm();
    } catch (err) {
      alert("Error saving invoice: " + err.message);
    } finally { setSubmitting(false); }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-2xl overflow-hidden shadow-xl shadow-black/40">
      <form onSubmit={handleSubmit}>

        {/* ── Customer Section ────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 space-y-4">
          <SectionDivider label="Customer" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Customer Name</Label>
              <Input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
              />
            </div>
            <div>
              <Label>WhatsApp Number</Label>
              <div className="flex rounded-xl border border-white/10 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/25 transition bg-[#161b22]">
                <span className="flex items-center px-3 text-slate-500 text-sm font-medium border-r border-white/10 bg-white/4 shrink-0">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-slate-600 px-3 py-3 text-sm focus:outline-none min-w-0"
                />
              </div>
            </div>
          </div>

          {hasGstin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Customer State</Label>
                <Select value={customerStateCode} onChange={e => setCustomerStateCode(e.target.value)}>
                  <option value="">Same as shop (Local)</option>
                  {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
                </Select>
              </div>
              <div>
                <Label>Customer GSTIN</Label>
                <Input
                  type="text"
                  value={customerGstin}
                  onChange={e => setCustomerGstin(e.target.value.toUpperCase())}
                  placeholder="27AAAAA0000A1Z5"
                  className="uppercase"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Quick Add from Inventory ─────────────────────────────────── */}
        {inventoryProducts.length > 0 && (
          <div className="px-5 sm:px-6 pb-4">
            <SectionDivider label="Quick Add" />
            <div className="flex flex-wrap gap-2 mt-3">
              {inventoryProducts.map(ip => (
                <button
                  key={ip.id}
                  type="button"
                  onClick={() => addInventoryProduct(ip)}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-indigo-600/20 hover:border-indigo-500/50
                    text-slate-300 hover:text-white text-xs py-2 px-3 rounded-lg border border-white/10
                    transition-all duration-150 whitespace-nowrap"
                >
                  <span className="font-medium">{ip.name}</span>
                  <span className="text-slate-500 text-[10px]">₹{ip.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Products ─────────────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pb-4 space-y-3">
          <SectionDivider label="Products" />

          <div className="space-y-3 mt-3">
            {products.map((p, i) => (
              <div key={i} className="bg-[#161b22] border border-white/8 rounded-xl p-4 relative group transition hover:border-white/14">

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeProduct(i)}
                  disabled={products.length === 1}
                  className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center
                    text-slate-600 hover:text-rose-400 disabled:opacity-20 bg-white/4 hover:bg-rose-500/10
                    rounded-lg border border-white/8 transition text-sm font-bold"
                  title="Remove item"
                >
                  ×
                </button>

                {/* Item name */}
                <div className="mb-3 pr-8">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Blue Denim Jeans"
                    value={p.name}
                    list="frequent-items"
                    onChange={e => updateProduct(i, "name", e.target.value)}
                    className="w-full bg-[#0d1117] border border-white/10 text-white placeholder-slate-700
                      rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    required
                  />
                </div>

                {/* Qty / Rate / GST row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Qty</label>
                    <input
                      type="number" min="1" value={p.qty}
                      onChange={e => updateProduct(i, "qty", e.target.value)}
                      className="w-full bg-[#0d1117] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Rate (₹)</label>
                    <input
                      type="number" min="0" step="0.01" placeholder="0.00" value={p.price}
                      onChange={e => updateProduct(i, "price", e.target.value)}
                      className="w-full bg-[#0d1117] border border-white/10 text-white placeholder-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                      required
                    />
                  </div>
                  {hasGstin ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">GST %</label>
                      <select
                        value={p.gstRate}
                        onChange={e => updateProduct(i, "gstRate", e.target.value)}
                        className="w-full bg-[#0d1117] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-end">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Line Total</label>
                      <p className="text-sm font-bold text-white py-2.5 text-right">
                        ₹{((Number(p.qty) || 0) * (Number(p.price) || 0)).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Line total (when GST is showing) */}
                {hasGstin && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/6">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Line Total</span>
                    <span className="text-sm font-bold text-white">
                      ₹{((Number(p.qty) || 0) * (Number(p.price) || 0)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addProductRow}
            className="w-full mt-2 flex items-center justify-center gap-2 border border-dashed border-white/12
              hover:border-indigo-500/50 hover:bg-indigo-600/8 text-slate-500 hover:text-indigo-400
              py-3 rounded-xl text-sm font-medium transition-all duration-150"
          >
            <span className="text-lg leading-none">+</span> Add another product
          </button>

          <datalist id="frequent-items">
            {inventoryProducts.map(p => <option key={p.id} value={p.name} />)}
            {frequentItems.map((item, idx) => {
              if (inventoryProducts.some(p => p.name.toLowerCase() === item.toLowerCase())) return null;
              return <option key={`freq-${idx}`} value={item} />;
            })}
          </datalist>
        </div>

        {/* ── Totals ───────────────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pb-4">
          <SectionDivider label="Summary" />
          <div className="mt-3 bg-[#161b22] border border-white/8 rounded-xl p-4 space-y-2.5">
            {hasGstin && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-300 font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total GST</span>
                  <span className="text-slate-300 font-medium">₹{totalGst.toFixed(2)}</span>
                </div>
                <div className="h-px bg-white/6" />
              </>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 font-medium">Grand Total</span>
              <span className="text-white font-bold text-base">₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Discount (−)</span>
              <input
                type="number" min="0" step="0.01" placeholder="0"
                value={discountAmount}
                onChange={e => setDiscountAmount(e.target.value)}
                className="w-28 bg-[#0d1117] border border-white/10 text-white placeholder-slate-700
                  rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div className="h-px bg-white/6" />
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-base">Final Amount</span>
              <span className="text-indigo-400 font-extrabold text-xl tracking-tight">₹{finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ── Payment ──────────────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pb-4 space-y-4">
          <SectionDivider label="Payment" />

          {/* Payment Mode — pill buttons */}
          <div>
            <Label required>Payment Mode</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {["Cash", "Online", "Split"].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150
                    ${paymentMode === mode
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-white/4 border-white/10 text-slate-400 hover:text-white hover:bg-white/8"}`}
                >
                  {mode === "Cash" ? "💵" : mode === "Online" ? "📱" : "↔️"} {mode}
                </button>
              ))}
            </div>
          </div>

          {paymentMode === "Split" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#161b22] border border-white/8 rounded-xl p-4">
              <div>
                <Label>Cash Amount (₹)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)} required />
              </div>
              <div>
                <Label>Online Amount (₹)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={onlineAmount}
                  onChange={e => setOnlineAmount(e.target.value)} required />
              </div>
            </div>
          )}

          {/* Payment Status — pill buttons */}
          <div>
            <Label>Payment Status</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { val: "paid",    label: "Paid",     color: "emerald" },
                { val: "partial", label: "Partial",  color: "amber"   },
                { val: "unpaid",  label: "Unpaid",   color: "rose"    },
              ].map(({ val, label, color }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPaymentStatus(val)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150
                    ${paymentStatus === val
                      ? color === "emerald" ? "bg-emerald-600/30 border-emerald-500/50 text-emerald-300"
                        : color === "amber"   ? "bg-amber-600/30 border-amber-500/50 text-amber-300"
                        : "bg-rose-600/30 border-rose-500/50 text-rose-300"
                      : "bg-white/4 border-white/10 text-slate-400 hover:text-white hover:bg-white/8"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {paymentStatus === "partial" && (
            <div>
              <Label>Amount Paid (₹)</Label>
              <Input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={amountPaid} onChange={e => setAmountPaid(e.target.value)} required
              />
            </div>
          )}
        </div>

        {/* ── WhatsApp Footer ───────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pb-4">
          <SectionDivider label="WhatsApp" />
          <div className="mt-3">
            <Label>Custom Footer Message</Label>
            <textarea
              placeholder="e.g. Thanks for shopping! Follow us on Instagram."
              value={customFooter}
              onChange={e => setCustomFooter(e.target.value)}
              rows={3}
              className="w-full bg-[#161b22] border border-white/10 text-white placeholder-slate-600
                rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
        </div>

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pb-6">
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500
              text-white font-bold py-4 rounded-xl text-sm tracking-wide shadow-lg shadow-indigo-500/30
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-[0.98] min-h-[56px]"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : customerPhone.replace(/\D/g, "").length >= 10 ? (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Save &amp; Send via WhatsApp
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Save Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
