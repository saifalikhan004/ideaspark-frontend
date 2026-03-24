import { useAuth, useUser } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      console.log("[Auth] Starting sign out process...");
      await signOut();
      console.log("[Auth] Successfully signed out from Clerk");
      // Give auth state time to update before navigation
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace("/(auth)/login" as any);
    } catch (err) {
      console.error("[Auth] Sign out error:", err);
      setSigningOut(false);
    }
  };

  return (
    <LinearGradient
      colors={["#070A12", "#0A1020", "#070A12"]}
      style={styles.container}
    >
      <Text style={styles.title}>Account</Text>

      <View style={styles.infoCard}>
        {user?.username && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user.username}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>
            {user?.primaryEmailAddress?.emailAddress || "N/A"}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleSignOut}
        disabled={signingOut}
        style={({ pressed }) => [
          pressed && { opacity: 0.8 },
          signingOut && { opacity: 0.5 },
        ]}
      >
        <View style={styles.signOutButton}>
          {signingOut ? (
            <ActivityIndicator color="#FF6B6B" />
          ) : (
            <Text style={styles.signOutText}>Sign Out</Text>
          )}
        </View>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#EAF0FF",
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(109,94,246,0.15)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    color: "rgba(234,240,255,0.5)",
  },
  infoValue: {
    color: "#EAF0FF",
    fontWeight: "500",
  },
  signOutButton: {
    backgroundColor: "rgba(255,107,107,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.3)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "600",
  },
});
