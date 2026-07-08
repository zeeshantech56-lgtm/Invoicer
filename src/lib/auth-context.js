// src/lib/auth-context.js
// Global auth state so any component can read the logged-in shop owner.

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, ADMIN_EMAIL } from "./firebase";

const AuthContext = createContext({ user: null, loading: true, isAdmin: false, isBanned: false, userData: null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        unsubscribeDoc = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
          if (snap.exists()) {
            setUserData(snap.data());
            setIsBanned(snap.data().banned === true);
          }
          setLoading(false);
        });
      } else {
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

  const isAdmin = !!user && !!ADMIN_EMAIL && user.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isBanned, userData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
