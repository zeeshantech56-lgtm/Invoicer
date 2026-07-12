import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction
} from "firebase/firestore";
import { db } from "./firebase";

export async function createPurchaseInvoice(purchaseData) {
  return await runTransaction(db, async (transaction) => {
    // 1. Read phase: get current stock for all products
    const productRefs = purchaseData.products.map(p => {
      // If we know the productId, use it.
      if (p.productId) {
        return { p, ref: doc(db, "users", purchaseData.shopId, "products", p.productId) };
      }
      return { p, ref: null };
    });

    const existingDocs = await Promise.all(
      productRefs.filter(item => item.ref !== null).map(item => transaction.get(item.ref))
    );

    // 2. Write phase: create the purchase invoice
    const newInvoiceRef = doc(collection(db, "purchaseInvoices"));
    transaction.set(newInvoiceRef, {
      ...purchaseData,
      createdAt: serverTimestamp()
    });

    // 3. Write phase: update product stockQty atomically
    let docIndex = 0;
    for (const item of productRefs) {
      if (item.ref) {
        const pDoc = existingDocs[docIndex++];
        if (pDoc.exists()) {
          const newStock = (pDoc.data().stockQty || 0) + item.p.qty;
          transaction.update(item.ref, { 
            stockQty: newStock, 
            purchasePrice: item.p.purchasePrice,
            updatedAt: serverTimestamp()
          });
        }
      } else {
        // Create new product if not matched
        const newProductRef = doc(collection(db, "users", purchaseData.shopId, "products"));
        transaction.set(newProductRef, {
          name: item.p.name,
          hsnCode: item.p.hsnCode || "",
          gstRate: item.p.gstRate || 0,
          purchasePrice: item.p.purchasePrice,
          price: item.p.purchasePrice * 1.2, // Default 20% margin if we want, but better to set it 0 and let user edit
          stockQty: item.p.qty,
          lowStockThreshold: 10,
          unit: "pcs",
          createdAt: serverTimestamp()
        });
        
        // Optionally update the purchase line item to have the new productId? 
        // We can't mutate the purchaseData object inside the transaction easily for the invoice 
        // since we already staged the write, but we can just let it have no ID in the purchase record.
      }
    }
    
    return { id: newInvoiceRef.id, total: purchaseData.grandTotal };
  });
}

export async function getPurchaseInvoices(shopId) {
  const q = query(
    collection(db, "purchaseInvoices"),
    where("shopId", "==", shopId),
    orderBy("createdAt", "desc")
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
