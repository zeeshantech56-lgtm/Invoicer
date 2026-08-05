// src/lib/auth-context.js
// Global auth state so any component can read the logged-in shop owner.

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext({ user: null, loading: true, isAdmin: false, isBanned: false, userData: null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Read admin status (wrapped in try-catch in case Firestore rules deny access)
        try {
          const adminSnap = await getDoc(doc(db, "admins", currentUser.uid));
          setIsAdmin(adminSnap.exists());
        } catch (err) {
          console.warn("Could not read admin status, defaulting to false:", err);
          setIsAdmin(false);
        }

        unsubscribeDoc = onSnapshot(
          doc(db, "users", currentUser.uid), 
          (snap) => {
            if (snap.exists()) {
              setUserData(snap.data());
              setIsBanned(snap.data().banned === true);
            }
            setLoading(false);
          },
          (err) => {
            console.warn("Could not read user profile:", err);
            setLoading(false);
          }
        );
      } else {
        setIsAdmin(false);
        setIsBanned(false);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isBanned, userData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
