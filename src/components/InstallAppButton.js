"use client";

import { useState, useEffect } from "react";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback for browsers that don't support the prompt event
      alert("To install the app, tap your browser menu and select 'Add to Home Screen'.");
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="bg-green-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-green-700 transition"
      >
        Download App
      </button>

      {/* iOS Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Install on iPhone</h3>
            <p className="text-sm text-gray-600 mb-6">
              To install Invoicer on your iPhone:
              <br /><br />
              1. Tap the <strong>Share</strong> button at the bottom of Safari (the square with an arrow pointing up).
              <br /><br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="bg-gray-900 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
