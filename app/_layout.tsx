import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env");
}

function AppContent() {
  const { isFirebaseReady } = useFirebaseAuth();

  if (!isFirebaseReady) {
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
