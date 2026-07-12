import { db } from "./firebase";
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query } from "firebase/firestore";

export async function getUserProducts(userId) {
  const productsRef = collection(db, "users", userId, "products");
  const q = query(productsRef);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addProduct(userId, productData) {
  const productsRef = collection(db, "users", userId, "products");
  const docRef = await addDoc(productsRef, {
    name: productData.name,
    price: Number(productData.price) || 0,
    hsnCode: productData.hsnCode || "",
    gstRate: Number(productData.gstRate) || 0,
    purchasePrice: Number(productData.purchasePrice) || 0,
    stockQty: Number(productData.stockQty) || 0,
    lowStockThreshold: Number(productData.lowStockThreshold) || 10,
    unit: productData.unit || "pcs",
    createdAt: new Date()
  });
  return { id: docRef.id, ...productData };
}

export async function updateProduct(userId, productId, productData) {
  const productRef = doc(db, "users", userId, "products", productId);
  await updateDoc(productRef, {
    name: productData.name,
    price: Number(productData.price) || 0,
    hsnCode: productData.hsnCode || "",
    gstRate: Number(productData.gstRate) || 0,
    purchasePrice: Number(productData.purchasePrice) || 0,
    stockQty: Number(productData.stockQty) || 0,
    lowStockThreshold: Number(productData.lowStockThreshold) || 10,
    unit: productData.unit || "pcs",
    updatedAt: new Date()
  });
}

export async function deleteProduct(userId, productId) {
  const productRef = doc(db, "users", userId, "products", productId);
  await deleteDoc(productRef);
}
