import { useUser, useAuth } from "@clerk/clerk-expo";
import { signInWithCustomToken } from "firebase/auth";
import { useEffect, useState } from "react";
import { firebaseAuth } from "../FirebaseConfig";

export function useFirebaseAuth() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    // If Clerk is still loading, wait.
    if (!isLoaded) return;

    // If user is not signed in via Clerk, sign out of Firebase.
    if (!isSignedIn) {
      void firebaseAuth.signOut();
      setIsFirebaseReady(true);
      return;
    }

    // Connect Clerk to Firebase.
    const connectFirebase = async () => {
      try {
        // Since Clerk natively deprecated Firebase tokens, we call our backend
        // to mint a custom token using the Clerk user ID.
        let backendUrl = "http://localhost:8000";
        // To handle Android testing safely without importing react-native if not needed,
        // we can dynamically check if running on device. Or simply use the local IP.
        // It's safer to use the same config as workspace.tsx:
        if (typeof window !== 'undefined' && navigator.product === 'ReactNative') {
            backendUrl = "http://192.168.31.195:8000";
        }
        
        const response = await fetch(`${backendUrl}/auth/firebase-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clerk_user_id: user.id })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch custom token: ${await response.text()}`);
        }
        
        const data = await response.json();
        const customToken = data.firebase_token;
        
        if (customToken) {
          await signInWithCustomToken(firebaseAuth, customToken);
        } else {
          console.error("Firebase custom token was empty.");
          void firebaseAuth.signOut();
        }
      } catch (err) {
        console.error("Firebase connection error:", err);
      } finally {
        setIsFirebaseReady(true);
      }
    };

    void connectFirebase();
  }, [isLoaded, isSignedIn, user, getToken]);

  return { isFirebaseReady };
}
