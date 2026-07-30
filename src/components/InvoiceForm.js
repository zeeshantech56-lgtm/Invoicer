// src/components/InvoiceForm.js
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

const emptyProduct = () => ({ name: "", qty: 1, mrp: "", discountPercent: "", price: "", productId: "", hsnCode: "", gstRate: "18" });

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500">*</span>}
        {hint && <span className="font-normal text-slate-400 ml-1">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full h-11 bg-white border border-slate-200 text-slate-900 placeholder-slate-400
        rounded-xl px-3.5 text-sm font-medium transition-all
        focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none
        hover:border-slate-300 ${className}`}
    />
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
function Select({ className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full h-11 bg-white border border-slate-200 text-slate-900
        rounded-xl px-3.5 text-sm font-medium transition-all appearance-none
        focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none
        hover:border-slate-300 ${className}`}
    >
      {children}
    </select>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function Section({ label }) {
  return (
    <div className="flex items-center gap-2.5 pt-1">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function InvoiceForm({ shopName }) {
  const { user } = useAuth();
  const [customerName, setCustomerName]           = useState("");
  const [customerPhone, setCustomerPhone]         = useState("");
  const [customerStateCode, setCustomerStateCode] = useState("");
  const [customerGstin, setCustomerGstin]         = useState("");
  const [products, setProducts]                   = useState([emptyProduct()]);
  const [submitting, setSubmitting]               = useState(false);
  const [customFooter, setCustomFooter]           = useState("");
  const [frequentItems, setFrequentItems]         = useState([]);
  const [paymentStatus, setPaymentStatus]         = useState("paid");
  const [amountPaid, setAmountPaid]               = useState("");
  const [discountAmount, setDiscountAmount]       = useState(0);
  const [paymentMode, setPaymentMode]             = useState("Cash");
  const [cashAmount, setCashAmount]               = useState("");
  const [onlineAmount, setOnlineAmount]           = useState("");
  const [shopProfile, setShopProfile]             = useState(null);
  const [inventoryProducts, setInventoryProducts] = useState([]);

  useEffect(() => {
    const savedFooter = localStorage.getItem("invoicer_custom_footer");
    if (savedFooter) setCustomFooter(savedFooter);
    const savedItems = localStorage.getItem("invoicer_frequent_items");
    if (savedItems) { try { setFrequentItems(JSON.parse(savedItems)); } catch (_) {} }
    if (user) {
      getUserProducts(user.uid).then(p => setInventoryProducts(p)).catch(console.error);
      getDoc(doc(db, "users", user.uid)).then(s => { if (s.exists()) setShopProfile(s.data()); }).catch(console.error);
    }
  }, [user]);

  const isInterState = shopProfile?.stateCode && customerStateCode && shopProfile.stateCode !== customerStateCode;
  const hasGstin     = !!shopProfile?.gstin;
  let subtotal = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0, totalGst = 0;

  const calculatedProducts = products.map(p => {
    const qty = Number(p.qty) || 0, price = Number(p.price) || 0;
    const lineSubtotal = qty * price;
    let g = { cgst: 0, sgst: 0, igst: 0, totalGst: 0 };
    if (hasGstin) g = calculateGstBreakdown(lineSubtotal, Number(p.gstRate) || 0, isInterState);
    subtotal += lineSubtotal; totalCgst += g.cgst; totalSgst += g.sgst; totalIgst += g.igst; totalGst += g.totalGst;
    return { ...p, lineSubtotal, ...g };
  });

  const grandTotal  = subtotal + totalGst;
  const finalAmount = Math.max(0, grandTotal - (Number(discountAmount) || 0));

  useEffect(() => {
    if (paymentMode === "Cash")   { setCashAmount(finalAmount.toFixed(2)); setOnlineAmount("0"); }
    if (paymentMode === "Online") { setCashAmount("0"); setOnlineAmount(finalAmount.toFixed(2)); }
  }, [paymentMode, finalAmount]);

  const updateProduct = (i, field, val) => setProducts(prev => prev.map((p, idx) => {
    if (idx !== i) return p;
    const u = { ...p, [field]: val };
    if (field === "mrp" || field === "discountPercent") {
      const m = field === "mrp" ? val : p.mrp;
      const d = field === "discountPercent" ? val : p.discountPercent;
      if (m && d) u.price = Math.max(0, Number(m) - (Number(m) * Number(d) / 100)).toFixed(2);
    }
    if (field === "name") {
      const m = inventoryProducts.find(ip => ip.name.toLowerCase() === val.toLowerCase());
      if (m) { if (!p.price || p.price === "" || p.price === "0" || p.price === 0) u.price = m.price; u.productId = m.id; u.hsnCode = m.hsnCode || ""; u.gstRate = m.gstRate || "0"; u.mrp = m.mrp || ""; u.discountPercent = m.discountPercent || ""; }
      else { u.productId = ""; u.mrp = ""; u.discountPercent = ""; }
    }
    return u;
  }));

  const addInventoryProduct = ip => {
    const ei = products.findIndex(p => p.name.trim().toLowerCase() === ip.name.trim().toLowerCase());
    if (ei !== -1) { setProducts(prev => prev.map((p, i) => i === ei ? { ...p, qty: Number(p.qty) + 1 } : p)); return; }
    const empty = products.findIndex(p => p.name.trim() === "" && (!p.price || p.price === "" || p.price === "0" || p.price === 0));
    const np = { name: ip.name, qty: 1, mrp: ip.mrp || "", discountPercent: ip.discountPercent || "", price: ip.price, productId: ip.id, hsnCode: ip.hsnCode || "", gstRate: ip.gstRate || "0" };
    if (empty !== -1) setProducts(prev => prev.map((p, i) => i === empty ? np : p)); else setProducts(prev => [...prev, np]);
  };

  const addProductRow = () => setProducts(p => [...p, emptyProduct()]);
  const removeProduct = i => setProducts(p => p.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setCustomerName(""); setCustomerPhone(""); setCustomerStateCode(""); setCustomerGstin("");
    setProducts([emptyProduct()]); setDiscountAmount(0); setPaymentMode("Cash"); setCashAmount(""); setOnlineAmount("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user) return;
    for (const p of products) {
      if (p.productId) {
        const inv = inventoryProducts.find(ip => ip.id === p.productId);
        if (inv && (inv.stockQty || 0) < p.qty) { alert(`Only ${inv.stockQty || 0} units of ${p.name} available.`); return; }
      }
    }
    setSubmitting(true);
    try {
      const clean = calculatedProducts.map(p => ({ name: p.name, qty: Number(p.qty)||0, mrp: p.mrp||"", discountPercent: p.discountPercent||"", price: Number(p.price)||0, productId: p.productId||"", hsnCode: p.hsnCode||"", gstRate: Number(p.gstRate)||0, lineSubtotal: p.lineSubtotal, cgst: p.cgst, sgst: p.sgst, igst: p.igst, totalGst: p.totalGst }));
      if (clean.some(p => p.qty <= 0 || p.price < 0)) { alert("Quantity must be > 0 and price cannot be negative."); setSubmitting(false); return; }
      const numDiscount = Number(discountAmount) || 0;
      if (numDiscount > grandTotal) { alert("Discount cannot exceed Grand Total."); setSubmitting(false); return; }
      const cash = Number(cashAmount) || 0, online = Number(onlineAmount) || 0;
      const v = validatePaymentMode(paymentMode, cash, online, finalAmount);
      if (!v.valid) { alert(v.error); setSubmitting(false); return; }
      const ni = new Set(frequentItems);
      clean.forEach(p => { if (p.name.trim()) ni.add(p.name.trim()); });
      const ui = Array.from(ni).slice(0, 50);
      setFrequentItems(ui);
      localStorage.setItem("invoicer_frequent_items", JSON.stringify(ui));
      localStorage.setItem("invoicer_custom_footer", customFooter);
      const rawPhone = customerPhone.replace(/\D/g, ""), fullPhone = rawPhone ? "91" + rawPhone : "";
      const { id, total: st } = await createInvoice({ shopId: user.uid, shopName: shopProfile?.shopName || shopName || "My Shop", shopGstin: shopProfile?.gstin || "", shopStateCode: shopProfile?.stateCode || "", shopAddress: shopProfile?.businessAddress || "", customerName, customerPhone: fullPhone, customerStateCode, customerGstin, products: clean, isInterState, subtotal, totalCgst, totalSgst, totalIgst, totalGst, grandTotal, discountAmount: numDiscount, finalAmount, paymentStatus, amountPaid: paymentStatus === "paid" ? finalAmount : (paymentStatus === "unpaid" ? 0 : amountPaid), paymentMode, cashAmount: cash, onlineAmount: online });
      if (fullPhone && rawPhone.length >= 10) {
        const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
        window.open(buildWhatsAppUrl({ phone: fullPhone, shopName: shopProfile?.shopName || shopName || "My Shop", customerName, products: clean, total: st, invoiceId: id, siteUrl, customFooter, paymentStatus, amountPaid: paymentStatus === "paid" ? finalAmount : (paymentStatus === "unpaid" ? 0 : amountPaid) }), "_blank");
      } else { alert("Invoice saved successfully!"); }
      resetForm();
    } catch (err) { alert("Error saving invoice: " + err.message); }
    finally { setSubmitting(false); }
  };

  // ── Payment mode options ─────────────────────────────────────────────────
  const modeOptions = [
    { val: "Cash",   icon: "💵", label: "Cash"   },
    { val: "Online", icon: "📲", label: "Online" },
    { val: "Split",  icon: "⇄",  label: "Split"  },
  ];

  const statusOptions = [
    { val: "paid",    label: "Paid",    cls: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
    { val: "partial", label: "Partial", cls: "text-amber-700  bg-amber-50  border-amber-200  hover:bg-amber-100"  },
    { val: "unpaid",  label: "Unpaid",  cls: "text-rose-700  bg-rose-50  border-rose-200  hover:bg-rose-100"  },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/80 overflow-hidden">
      <form onSubmit={handleSubmit} noValidate>

        {/* ─ Customer ─────────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 space-y-4">
          <Section label="Customer Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Customer Name" required>
              <Input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Rahul Sharma" required />
            </Field>
            <Field label="WhatsApp Number" hint="(Optional)">
              <div className="flex h-11 rounded-xl border border-slate-200 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15 hover:border-slate-300 transition-all bg-white">
                <span className="flex items-center px-3 text-slate-500 text-sm font-semibold bg-slate-50 border-r border-slate-200 shrink-0">+91</span>
                <input type="tel" placeholder="9876543210" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 px-3 text-sm font-medium focus:outline-none min-w-0" />
              </div>
            </Field>
          </div>

          {hasGstin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Customer State" hint="(Optional)">
                <div className="relative">
                  <Select value={customerStateCode} onChange={e => setCustomerStateCode(e.target.value)}>
                    <option value="">Same as shop (Local)</option>
                    {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
                  </Select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </Field>
              <Field label="Customer GSTIN" hint="(B2B)">
                <Input type="text" value={customerGstin} onChange={e => setCustomerGstin(e.target.value.toUpperCase())} placeholder="27AAAAA0000A1Z5" className="uppercase" />
              </Field>
            </div>
          )}
        </div>

        {/* ─ Quick Add ────────────────────────────────────────────── */}
        {inventoryProducts.length > 0 && (
          <div className="px-5 sm:px-6 pb-4 space-y-3">
            <Section label="Quick Add from Inventory" />
            <div className="flex flex-wrap gap-2">
              {inventoryProducts.map(ip => (
                <button key={ip.id} type="button" onClick={() => addInventoryProduct(ip)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 py-2 px-3 rounded-lg transition-all whitespace-nowrap">
                  {ip.name} <span className="text-slate-400 font-normal">₹{ip.price}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─ Products ─────────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pb-5 space-y-3">
          <Section label="Products" />
          <div className="space-y-3 mt-1">
            {products.map((p, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative">
                <button type="button" onClick={() => removeProduct(i)} disabled={products.length === 1}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-30 rounded-lg border border-slate-200 hover:border-rose-200 text-base font-bold transition-all bg-white"
                  title="Remove">×</button>

                <div className="mb-3 pr-10">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Item Name</label>
                  <input type="text" placeholder="e.g. Blue Denim Jeans" value={p.name} list="frequent-items"
                    onChange={e => updateProduct(i, "name", e.target.value)} required
                    className="w-full h-10 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg px-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 hover:border-slate-300 transition-all" />
                </div>

                <div className={`grid gap-2 sm:gap-3 ${hasGstin ? "grid-cols-3" : "grid-cols-2"}`}>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Qty</label>
                    <input type="number" min="1" value={p.qty} onChange={e => updateProduct(i, "qty", e.target.value)} required
                      className="w-full h-10 bg-white border border-slate-200 text-slate-900 rounded-lg px-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 hover:border-slate-300 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rate (₹)</label>
                    <input type="number" min="0" step="0.01" placeholder="0.00" value={p.price} onChange={e => updateProduct(i, "price", e.target.value)} required
                      className="w-full h-10 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg px-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 hover:border-slate-300 transition-all" />
                  </div>
                  {hasGstin && (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">GST %</label>
                      <div className="relative">
                        <select value={p.gstRate} onChange={e => updateProduct(i, "gstRate", e.target.value)}
                          className="w-full h-10 bg-white border border-slate-200 text-slate-900 rounded-lg px-3 text-sm font-medium appearance-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 hover:border-slate-300 transition-all">
                          {["0","5","12","18","28"].map(v => <option key={v} value={v}>{v}%</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Line Total</span>
                    {p.mrp && p.discountPercent && (
                      <span className="text-[10px] font-medium text-emerald-600 mt-0.5">
                        <span className="text-slate-400 line-through mr-1">₹{p.mrp}</span>
                        -{p.discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900">₹{((Number(p.qty)||0)*(Number(p.price)||0)).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addProductRow}
            className="w-full h-11 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-xl text-sm font-semibold transition-all mt-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add another product
          </button>

          <datalist id="frequent-items">
            {inventoryProducts.map(p => <option key={p.id} value={p.name} />)}
            {frequentItems.map((item, idx) => { if (inventoryProducts.some(p => p.name.toLowerCase() === item.toLowerCase())) return null; return <option key={`f-${idx}`} value={item} />; })}
          </datalist>
        </div>

        {/* ─ Summary ──────────────────────────────────────────────── */}
        <div className="mx-5 sm:mx-6 mb-5 rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-5 py-4 space-y-2.5">
            {hasGstin && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-semibold text-slate-700">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Total GST</span>
                  <span className="font-semibold text-slate-700">₹{totalGst.toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-200" />
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Grand Total</span>
              <span className="text-lg font-bold text-slate-900">₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Discount (−)</span>
              <input type="number" min="0" step="0.01" placeholder="0" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)}
                className="w-28 h-9 bg-white border border-slate-200 rounded-lg px-3 text-sm font-semibold text-right text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all" />
            </div>
          </div>
          <div className="bg-indigo-600 px-5 py-4 flex items-center justify-between">
            <span className="text-indigo-100 text-sm font-bold uppercase tracking-wide">Final Amount</span>
            <span className="text-white text-2xl font-extrabold tracking-tight">₹{finalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* ─ Payment Mode ─────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pb-5 space-y-3">
          <Section label="Payment Mode" />
          <div className="grid grid-cols-3 gap-2 mt-1">
            {modeOptions.map(({ val, icon, label }) => (
              <button key={val} type="button" onClick={() => setPaymentMode(val)}
                className={`h-11 flex items-center justify-center gap-1.5 rounded-xl border-2 text-sm font-semibold transition-all
                  ${paymentMode === val ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50"}`}>
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>

          {paymentMode === "Split" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <Field label="Cash Amount (₹)">
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={cashAmount} onChange={e => setCashAmount(e.target.value)} required />
              </Field>
              <Field label="Online Amount (₹)">
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={onlineAmount} onChange={e => setOnlineAmount(e.target.value)} required />
              </Field>
            </div>
          )}
        </div>

        {/* ─ Payment Status ────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pb-5 space-y-3">
          <Section label="Payment Status" />
          <div className="grid grid-cols-3 gap-2 mt-1">
            {statusOptions.map(({ val, label, cls }) => (
              <button key={val} type="button" onClick={() => setPaymentStatus(val)}
                className={`h-11 rounded-xl border-2 text-sm font-bold transition-all
                  ${paymentStatus === val ? cls + " ring-2 ring-offset-1 " + (val==="paid" ? "ring-emerald-400" : val==="partial" ? "ring-amber-400" : "ring-rose-400") : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                {label}
              </button>
            ))}
          </div>
          {paymentStatus === "partial" && (
            <div className="mt-1">
              <Field label="Amount Paid (₹)">
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} required />
              </Field>
            </div>
          )}
        </div>

        {/* ─ WhatsApp Footer ───────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pb-5 space-y-3">
          <Section label="WhatsApp Message" />
          <textarea rows={3} placeholder="e.g. Thanks for shopping with us! Visit again 🙏"
            value={customFooter} onChange={e => setCustomFooter(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-3.5 py-3 text-sm font-medium resize-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 hover:border-slate-300 transition-all mt-1" />
        </div>

        {/* ─ Submit ────────────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pb-6">
          <button type="submit" disabled={submitting}
            className="w-full h-14 flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
              text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35
              transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]">
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
            ) : customerPhone.replace(/\D/g,"").length >= 10 ? (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Save &amp; Send via WhatsApp
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
