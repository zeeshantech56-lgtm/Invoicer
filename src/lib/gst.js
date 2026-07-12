// src/lib/gst.js

/**
 * Calculates GST breakdown for a given subtotal.
 * @param {number} subtotal - The line item subtotal (qty * price)
 * @param {number} gstRate - The GST rate percentage (e.g. 5, 12, 18, 28)
 * @param {boolean} isInterState - True if inter-state (IGST), false if intra-state (CGST + SGST)
 * @returns {object} { cgst, sgst, igst, totalGst }
 */
export function calculateGstBreakdown(subtotal, gstRate, isInterState) {
  if (!gstRate || gstRate <= 0) {
    return { cgst: 0, sgst: 0, igst: 0, totalGst: 0 };
  }

  const lineGstAmount = subtotal * (gstRate / 100);

  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: lineGstAmount,
      totalGst: lineGstAmount
    };
  } else {
    const halfGst = lineGstAmount / 2;
    return {
      cgst: halfGst,
      sgst: halfGst,
      igst: 0,
      totalGst: lineGstAmount
    };
  }
}

/**
 * Generates a CSV string for GSTR-1 summary.
 * @param {Array} invoices - Array of sales invoices
 * @returns {string} CSV content
 */
export function exportGstr1Summary(invoices) {
  const headers = [
    "Invoice Number",
    "Invoice Date",
    "Customer GSTIN",
    "Invoice Value",
    "Taxable Value",
    "CGST",
    "SGST",
    "IGST",
    "Total GST"
  ];

  const rows = invoices.map(inv => {
    // Basic date formatting
    const dateStr = inv.timestamp && inv.timestamp.toDate 
      ? inv.timestamp.toDate().toLocaleDateString('en-IN') 
      : (new Date(inv.timestamp)).toLocaleDateString('en-IN');

    return [
      inv.id,
      dateStr,
      inv.customerGstin || "",
      (inv.grandTotal || 0).toFixed(2),
      (inv.subtotal || 0).toFixed(2),
      (inv.totalCgst || 0).toFixed(2),
      (inv.totalSgst || 0).toFixed(2),
      (inv.totalIgst || 0).toFixed(2),
      (inv.totalGst || 0).toFixed(2)
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
