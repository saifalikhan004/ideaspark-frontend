import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { useEffect, useState } from "react";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env");
}

function AppContent() {
  const { isFirebaseReady } = useFirebaseAuth();
  const { isLoaded: clerkLoaded } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // App is ready when Clerk has loaded (don't wait for Firebase here)
    // Firebase initialization will be handled by layout groups
    if (clerkLoaded) {
      console.log("[Root] Clerk loaded, starting app navigation");
      setAppReady(true);
    }
  }, [clerkLoaded]);

  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: "#070A12", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6D5EF6" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AppContent />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
