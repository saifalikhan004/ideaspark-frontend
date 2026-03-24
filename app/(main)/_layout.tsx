import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";

export default function MainLayout() {
  const { isSignedIn, isLoaded: clerkLoaded } = useAuth();
  const { isFirebaseReady, authError } = useFirebaseAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for both services to be ready
    if (clerkLoaded && isFirebaseReady) {
      console.log(
        `[Main Layout] Ready - isSignedIn: ${isSignedIn}, authError: ${authError}`,
      );
      setReady(true);
    }
  }, [clerkLoaded, isFirebaseReady, isSignedIn, authError]);

  if (!clerkLoaded || !isFirebaseReady || !ready) {
    console.log(
      `[Main Layout] Waiting... Clerk: ${clerkLoaded}, Firebase: ${isFirebaseReady}`,
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

  if (!isSignedIn) {
    console.log("[Main Layout] User not signed in, redirecting to auth...");
    return <Redirect href={"/(auth)/login" as any} />;
  }

  // User is signed in but Firebase auth failed - show error but allow access
  if (authError) {
    console.warn(
      "[Main Layout] Firebase auth had error but proceeding:",
      authError,
    );
    // Continue anyway - Firestore operations will handle the error
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0A1020",
          borderTopColor: "rgba(255,255,255,0.08)",
        },
        tabBarActiveTintColor: "#ffaa00",
        tabBarInactiveTintColor: "rgba(234,240,255,0.5)",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Text style={{ color: "#ffaa00", fontSize: 18 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="recent"
        options={{
          title: "Recent",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>🕒</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
