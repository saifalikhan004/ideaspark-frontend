import { useAuth, useUser } from "@clerk/clerk-expo";
import {
  signOut as firebaseSignOut,
  signInWithCustomToken,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { firebaseAuth } from "../FirebaseConfig";

export function useFirebaseAuth() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);

  useEffect(() => {
    // If Clerk is still loading, wait.
    if (!isLoaded) return;

    // If user is not signed in via Clerk, sign out of Firebase.
    if (!isSignedIn) {
      console.log("[Firebase Auth] Clerk user signed out, clearing Firebase");
      void firebaseSignOut(firebaseAuth).catch((err) => {
        console.error("[Firebase Auth] Error signing out of Firebase:", err);
      });
      setIsFirebaseReady(true);
      setAuthError(null);
      setPreviousUserId(null);
      return;
    }

    // Check if user switched (different clerk_user_id)
    if (previousUserId && previousUserId !== user.id) {
      console.log(
        `[Firebase Auth] User switched from ${previousUserId} to ${user.id}, clearing Firebase session`,
      );
      void firebaseSignOut(firebaseAuth).catch((err) => {
        console.error("[Firebase Auth] Error clearing previous session:", err);
      });
    }
    setPreviousUserId(user.id);

    const connectFirebase = async (retryCount = 0) => {
      try {
        // Get backend URL with better detection
        let backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
        
        if (!backendUrl) {
          // Default to localhost for local development
          backendUrl = "http://localhost:8000";
          console.log("[Firebase Auth] Backend URL not set, using localhost");
        }

        console.log(
          `[Firebase Auth] Connecting user ${user.id} to Firebase @ ${backendUrl}...`,
        );

        // Timeout for backend call
        // Note: Render free tier can take 50+ seconds to wake from hibernation
        const timeout = backendUrl.includes('onrender.com') ? 70000 : 30000;
        console.log(`[Firebase Auth] Using ${timeout}ms timeout...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${backendUrl}/auth/firebase-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerk_user_id: user.id,
            email: user.primaryEmailAddress?.emailAddress || "",
            username: user.username || user.firstName || "",
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[Firebase Auth] Backend error: ${response.status} - ${errorText}`,
          );
          throw new Error(`Backend error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const customToken = data.firebase_token;

        if (customToken) {
          console.log(`[Firebase Auth] Got token, signing in user ${user.id}...`);
          await signInWithCustomToken(firebaseAuth, customToken);
          console.log(
            `[Firebase Auth] ✓ Successfully authenticated ${user.id}`,
          );
          setIsFirebaseReady(true);
          setAuthError(null);
        } else {
          throw new Error("No Firebase token received from backend");
        }
      } catch (err: any) {
        let errorMsg = "Unknown error";
        
        if (err?.name === "AbortError") {
          if (backendUrl.includes('onrender.com')) {
            errorMsg = "Backend wake-up timeout (70s). Render free tier hibernates - try again, first request wakes it up.";
          } else {
            errorMsg = `Backend request timed out. Is backend running at ${backendUrl}?`;
          }
        } else if (err?.message?.includes("fetch failed")) {
          errorMsg = `Backend unreachable at ${backendUrl}. Check if it's deployed and accessible.`;
        } else {
          errorMsg = err?.message || String(err);
        }

        console.error(`[Firebase Auth] Connection error: ${errorMsg}`);
        console.log(`[Firebase Auth] Retry attempt: ${retryCount + 1}/3`);
        
        setAuthError(errorMsg);
        
        // Retry logic - max 3 attempts
        if (retryCount < 2) {
          console.log(`[Firebase Auth] Retrying in 2 seconds...`);
          setTimeout(() => connectFirebase(retryCount + 1), 2000);
        } else {
          // Give up after 3 attempts
          await firebaseSignOut(firebaseAuth).catch(() => {});
          console.log(
            "[Firebase Auth] Marking ready after retries exhausted (timeout protection)",
          );
          setIsFirebaseReady(true);
        }
      }
    };

    void connectFirebase(0);
  }, [isLoaded, isSignedIn, user?.id, getToken]);

  return { isFirebaseReady, authError };
}
