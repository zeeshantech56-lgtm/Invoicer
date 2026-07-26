// src/lib/paymentHelpers.js
// Helper utilities for payment mode tracking and validation

/**
 * Validates payment mode data for consistency
 * @param {string} paymentMode - "Cash", "Online", or "Split"
 * @param {number} cashAmount - Amount paid in cash
 * @param {number} onlineAmount - Amount paid online
 * @param {number} invoiceTotal - Total invoice amount
 * @returns {object} { valid: boolean, error: string | null }
 */
export function validatePaymentMode(paymentMode, cashAmount, onlineAmount, invoiceTotal) {
  const cash = Number(cashAmount) || 0;
  const online = Number(onlineAmount) || 0;
  const total = Number(invoiceTotal) || 0;

  // Prevent NaN values
  if (isNaN(cash) || isNaN(online) || isNaN(total)) {
    return { valid: false, error: "Invalid payment amounts" };
  }

  // No negative values
  if (cash < 0 || online < 0) {
    return { valid: false, error: "Payment amounts cannot be negative" };
  }

  switch (paymentMode) {
    case "Cash":
      if (Math.abs(cash - total) > 0.01) { // Allow for small floating point errors
        return { valid: false, error: `Cash amount must equal total (₹${total.toFixed(2)})` };
      }
      if (online !== 0) {
        return { valid: false, error: "Online amount must be 0 for Cash mode" };
      }
      return { valid: true, error: null };

    case "Online":
      if (Math.abs(online - total) > 0.01) {
        return { valid: false, error: `Online amount must equal total (₹${total.toFixed(2)})` };
      }
      if (cash !== 0) {
        return { valid: false, error: "Cash amount must be 0 for Online mode" };
      }
      return { valid: true, error: null };

    case "Split":
      const sum = cash + online;
      if (Math.abs(sum - total) > 0.01) {
        return { valid: false, error: `Cash + Online (₹${sum.toFixed(2)}) must equal total (₹${total.toFixed(2)})` };
      }
      if (cash === 0 || online === 0) {
        return { valid: false, error: "Both cash and online amounts must be greater than 0 for Split mode" };
      }
      return { valid: true, error: null };

    default:
      return { valid: false, error: "Invalid payment mode" };
  }
}

/**
 * Sanitizes payment data to ensure no NaN or invalid values
 * @param {object} paymentData - Payment data object
 * @returns {object} Sanitized payment data
 */
export function sanitizePaymentData(paymentData) {
  const { paymentMode, cashAmount, onlineAmount } = paymentData;
  const cash = Math.max(0, Number(cashAmount) || 0);
  const online = Math.max(0, Number(onlineAmount) || 0);

  return {
    paymentMode: paymentMode || "Cash",
    cashAmount: isNaN(cash) ? 0 : Number(cash.toFixed(2)),
    onlineAmount: isNaN(online) ? 0 : Number(online.toFixed(2))
  };
}

/**
 * Gets payment display text for UI
 * @param {object} invoice - Invoice object with payment fields
 * @returns {string} Formatted payment info
 */
export function getPaymentDisplayText(invoice) {
  const mode = invoice.paymentMode || "Unknown";
  const cash = Number(invoice.cashAmount) || 0;
  const online = Number(invoice.onlineAmount) || 0;

  switch (mode) {
    case "Cash":
      return `Cash: ₹${cash.toFixed(2)}`;
    case "Online":
      return `Online: ₹${online.toFixed(2)}`;
    case "Split":
      return `Split: Cash ₹${cash.toFixed(2)} + Online ₹${online.toFixed(2)}`;
    default:
      return "Unknown";
  }
}

/**
 * Calculates total cash and online collections for a set of invoices
 * @param {array} invoices - Array of invoice objects
 * @returns {object} { totalCash: number, totalOnline: number }
 */
export function calculateCollections(invoices) {
  let totalCash = 0;
  let totalOnline = 0;

  invoices.forEach(inv => {
    totalCash += Number(inv.cashAmount) || 0;
    totalOnline += Number(inv.onlineAmount) || 0;
  });

  return {
    totalCash: Number(totalCash.toFixed(2)),
    totalOnline: Number(totalOnline.toFixed(2))
  };
}

/**
 * Gets today's invoices
 * @param {array} invoices - Array of invoice objects
 * @returns {array} Today's invoices
 */
export function getTodayInvoices(invoices) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return invoices.filter(inv => {
    if (!inv.timestamp?.toDate) return false;
    const invDate = inv.timestamp.toDate();
    return invDate >= today;
  });
}
