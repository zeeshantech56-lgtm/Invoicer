// src/lib/invoices.js
// Shared helpers for creating invoices and building the WhatsApp message + public link.
// Centralizing this avoids duplicating the multi-tenant/date logic across pages.

import {
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  runTransaction
} from "firebase/firestore";
import { db } from "./firebase";

// Shop owners only ever see the last 6 months of their own invoices.
// 2. Multi-tenant rules:
// The firestore rules ensure that a user can ONLY read invoices where `shopId == auth.uid`.
export const RETENTION_DAYS = 180;

export function thirtyDaysAgoTimestamp() {
  const d = new Date();
  d.setDate(d.getDate() - RETENTION_DAYS);
  return Timestamp.fromDate(d);
}

// Creates an invoice document tied to the logged-in shop's UID.
// Returns the new invoice's Firestore ID, used to build the public link.
export async function createInvoice({ 
  shopId, shopName, shopGstin, shopStateCode, shopAddress,
  customerName, customerPhone, customerStateCode, customerGstin,
  products, isInterState, subtotal, totalCgst, totalSgst, totalIgst, totalGst, grandTotal 
}) {
  return await runTransaction(db, async (transaction) => {
    // 1. Read Phase: Get stock for all matched products
    const productRefs = products
      .filter(p => p.productId)
      .map(p => ({ p, ref: doc(db, "users", shopId, "products", p.productId) }));
    
    const productDocs = await Promise.all(
      productRefs.map(({ref}) => transaction.get(ref))
    );

    // 2. Check Phase: Verify sufficient stock
    productDocs.forEach((pDoc, index) => {
      const requestedQty = productRefs[index].p.qty;
      if (pDoc.exists()) {
        const currentStock = pDoc.data().stockQty || 0;
        if (currentStock < requestedQty) {
          throw new Error(`Only ${currentStock} units of ${pDoc.data().name} available in stock.`);
        }
      }
    });

    // 3. Write Phase: Update stock
    productDocs.forEach((pDoc, index) => {
      const requestedQty = productRefs[index].p.qty;
      if (pDoc.exists()) {
        const currentStock = pDoc.data().stockQty || 0;
        transaction.update(pDoc.ref, { stockQty: currentStock - requestedQty });
      }
    });

    // 4. Write Phase: Create Invoice
    const invoiceRef = doc(collection(db, "invoices"));
    transaction.set(invoiceRef, {
      shopId,          // multi-tenant key
      shopName,
      shopGstin: shopGstin || "",
      shopStateCode: shopStateCode || "",
      shopAddress: shopAddress || "",
      customerName,
      customerPhone,
      customerStateCode: customerStateCode || "",
      customerGstin: customerGstin || "",
      products,         
      isInterState: !!isInterState,
      subtotal: Number(subtotal) || 0,
      totalCgst: Number(totalCgst) || 0,
      totalSgst: Number(totalSgst) || 0,
      totalIgst: Number(totalIgst) || 0,
      totalGst: Number(totalGst) || 0,
      total: Number(grandTotal) || 0, // Keep total field for backward compatibility
      grandTotal: Number(grandTotal) || 0,
      paymentStatus: "paid",
      amountPaid: Number(grandTotal) || 0,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    return { id: invoiceRef.id, total: Number(grandTotal) || 0 };
  });
}

// Fetches a single invoice by ID — used by the public /invoice/[id] page.
// No auth required to read; Firestore rules allow single-doc reads by anyone
// (needed since customers open this link from WhatsApp) but never a full list.
export async function getInvoiceById(invoiceId) {
  const snap = await getDoc(doc(db, "invoices", invoiceId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Live-subscribes to a shop's own invoices from the last 180 days only.
export function subscribeToShopInvoices(shopId, callback, onError) {
  const q = query(
    collection(db, "invoices"),
    where("shopId", "==", shopId),
    where("timestamp", ">=", thirtyDaysAgoTimestamp()),
    orderBy("timestamp", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => {
    if (onError) onError(error);
  });
}

// Admin-only: subscribes to ALL invoices across every shop, no date limit.
export function subscribeToAllInvoices(callback) {
  const q = query(collection(db, "invoices"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Builds the WhatsApp deep link. Message includes a public link to the
// hosted invoice page so the customer can view a clean, permanent copy.
export function buildWhatsAppUrl({ phone, shopName, customerName, products, total, invoiceId, siteUrl, customFooter }) {
  let cleanedPhone = phone.replace(/[^0-9]/g, "");
  if (!cleanedPhone.startsWith("91") && cleanedPhone.length === 10) {
    cleanedPhone = "91" + cleanedPhone;
  }
  const lines = products.map((p) => `${p.qty}x ${p.name} - Rs ${(p.qty * p.price).toFixed(2)}`);
  const invoiceLink = `${siteUrl}/invoice/${invoiceId}`;

  const message =
    `*INVOICE: ${shopName}*\n` +
    `----------------------------------------\n\n` +
    `Hi ${customerName},\n\n` +
    `Here is a quick summary of your purchase today:\n\n` +
    `*Items:*\n` +
    `${lines.map((line) => `- ${line}`).join("\n")}\n\n` +
    `*Total Amount: Rs ${total.toFixed(2)}*\n\n` +
    `----------------------------------------\n` +
    `*View your full digital receipt here:*\n` +
    `${invoiceLink}\n\n` +
    `Thank you for shopping with us! We hope to see you again soon.\n\n` +
    (customFooter ? `*Note:* ${customFooter}\n` : ``);

  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}
