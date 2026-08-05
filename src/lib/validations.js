import { z } from "zod";

export const emailSchema = z.string().email("Invalid email address");

export const phoneSchema = z.string().refine((val) => {
  const cleaned = val.replace(/[^0-9]/g, "");
  return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith("91"));
}, "Phone number must be a valid 10-digit Indian number");

export const gstinSchema = z.string().optional().refine((val) => {
  if (!val) return true; // Optional
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val.toUpperCase());
}, "Invalid GSTIN format");

export const shopNameSchema = z.string().min(2, "Shop name must be at least 2 characters").max(100, "Shop name too long").regex(/^[\w\s&.-]+$/, "Shop name contains invalid characters");

export const invoiceItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  qty: z.number().positive("Quantity must be positive"),
  price: z.number().nonnegative("Price must be non-negative")
});

export const invoiceItemsSchema = z.array(invoiceItemSchema).min(1, "At least one item is required");
