// src/lib/invoices.js
// Shared helpers for creating invoices and building the WhatsApp message + public link.
// Centralizing this avoids duplicating the multi-tenant/date logic across pages.

import {
  collection,
  addDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
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
export async function createInvoice({ shopId, shopName, customerName, customerPhone, products }) {
  const total = products.reduce((sum, p) => sum + Number(p.qty) * Number(p.price), 0);

  const docRef = await addDoc(collection(db, "invoices"), {
    shopId,          // <-- ties this invoice to the shop owner's UID (multi-tenant key)
    shopName,
    customerName,
    customerPhone,
    products,         // [{ name, qty, price }]
    total,
    timestamp: serverTimestamp(),
  });

  return { id: docRef.id, total };
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
