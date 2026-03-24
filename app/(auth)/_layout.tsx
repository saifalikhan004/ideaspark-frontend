import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded: clerkLoaded } = useAuth();
  const { isFirebaseReady } = useFirebaseAuth();
  const [canRedirect, setCanRedirect] = useState(false);

  useEffect(() => {
    // Only mark as ready to redirect when BOTH are ready
    if (clerkLoaded && isFirebaseReady) {
      console.log(
        `[Auth Layout] Both ready - Clerk: ${clerkLoaded}, Firebase: ${isFirebaseReady}, SignedIn: ${isSignedIn}`,
      );
      setCanRedirect(true);
    }
  }, [clerkLoaded, isFirebaseReady, isSignedIn]);

  // Show loading screen while waiting for auth services
  if (!clerkLoaded || !isFirebaseReady) {
    console.log(
      `[Auth Layout] Waiting... Clerk: ${clerkLoaded}, Firebase: ${isFirebaseReady}`,
    );
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#070A12",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#6D5EF6" />
      </View>
    );
  }

  // If user is signed in and we can redirect, go to main
  if (isSignedIn && canRedirect) {
    console.log("[Auth Layout] User signed in AND ready, redirecting to main...");
    return <Redirect href={"/(main)/home" as any} />;
  }

  // User not signed in, show auth screens
  console.log("[Auth Layout] User not signed in, showing auth screens");
  return <Stack screenOptions={{ headerShown: false }} />;
}
