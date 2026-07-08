// src/app/login/page.js
// Shop owner signup + login. Creates a /users/{uid} profile doc on first signup.

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import Logo from "@/components/Logo";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const [isSignup, setIsSignup] = useState(searchParams.get("signup") === "1");
  const [shopName, setShopName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setIsSignup(searchParams.get("signup") === "1");
  }, [searchParams]);



  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        const cleanName = shopName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!cleanName) throw new Error("Please enter a valid shop name.");
        
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await cred.user.getIdToken(true); // Force token propagation to Firestore
          await runTransaction(db, async (transaction) => {
            const nameRef = doc(db, "shopNames", cleanName);
            const nameSnap = await transaction.get(nameRef);
            if (nameSnap.exists()) {
              throw new Error("This shop name is already taken. Please choose another one.");
            }
            transaction.set(nameRef, { uid: cred.user.uid });
            transaction.set(
              doc(db, "users", cred.user.uid),
              {
                shopName: shopName || "My Shop",
                email: email,
                phoneNumber: phoneNumber || "",
                createdAt: serverTimestamp(),
              },
              { merge: true }
            );
          });
        } catch (err) {
          if (cred.user) await cred.user.delete();
          throw err;
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await result.user.getIdToken(true); // Force token propagation to Firestore
      const snap = await getDoc(doc(db, "users", result.user.uid));
      if (snap.exists()) {
        router.push("/dashboard");
      } else {
        setShopName(result.user.displayName || "");
        setGoogleUser(result.user);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOnboarding = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cleanName = shopName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!cleanName) throw new Error("Please enter a valid shop name.");
      
      await runTransaction(db, async (transaction) => {
        const nameRef = doc(db, "shopNames", cleanName);
        const nameSnap = await transaction.get(nameRef);
        if (nameSnap.exists()) {
          throw new Error("This shop name is already taken. Please choose another one.");
        }
        transaction.set(nameRef, { uid: googleUser.uid });
        transaction.set(
          doc(db, "users", googleUser.uid),
          {
            shopName: shopName || "My Shop",
            email: googleUser.email,
            phoneNumber: phoneNumber || "",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo size="lg" />
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8 shadow-sm">
          <p className="text-sm text-gray-500 mb-6 text-center">
            {googleUser ? "Just one more step!" : isSignup ? "Create your shop account" : "Sign in to your dashboard"}
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          {googleUser ? (
            <form onSubmit={handleGoogleOnboarding} className="space-y-3">
              <input
                type="text"
                placeholder="Shop name"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded hover:bg-gray-800 transition disabled:opacity-50"
              >
                {loading ? "Please wait..." : "Complete signup"}
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {isSignup && (
                  <>
                    <input
                      type="text"
                      placeholder="Shop name"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      required
                    />
                  </>
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                  minLength={6}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {loading ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
                </button>
              </form>

              <div className="flex items-center gap-2 my-4">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-xs text-gray-400">OR</span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full border border-gray-300 text-sm font-medium py-2 rounded hover:bg-gray-50 transition"
              >
                Continue with Google
              </button>

              <p className="text-xs text-gray-500 mt-6 text-center">
                {isSignup ? "Already have an account?" : "New shop owner?"}{" "}
                <button
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-gray-900 font-medium underline"
                >
                  {isSignup ? "Sign in" : "Create account"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
