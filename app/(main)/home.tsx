import { useAuth, useUser } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { firestoreDB } from "../../FirebaseConfig";

import { Workspace, WorkspaceStore } from "../../storage/workspaceStore";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [ideaCount, setIdeaCount] = useState(0);
  const [recent, setRecent] = useState<Workspace[]>([]);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      console.log("[Home] No user ID available");
      return;
    }

    console.log(`[Home] Initializing for user: ${user.id}`);

    // Ensure user doc exists in Firestore (for new users on first login)
    const userRef = doc(firestoreDB, "users", user.id);
    void setDoc(
      userRef,
      {
        username: user.username || user.firstName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    ).catch((error) => {
      console.error("[Home] User profile sync error:", error);
      console.error("[Home] Error code:", error?.code);
      console.error("[Home] Error message:", error?.message);
      // Don't stop loading - continue even if this fails
    });

    // Load idea count with detailed error handling
    WorkspaceStore.count(user.id)
      .then((count) => {
        console.log(`[Home] User has ${count} ideas`);
        setIdeaCount(count);
      })
      .catch((error) => {
        console.error("[Home] Idea count load error:", error);
        console.error("[Home] Error code:", error?.code);
        console.error("[Home] Error message:", error?.message);
        setIdeaCount(0);
      });

    // Load recent ideas with detailed error handling
    WorkspaceStore.getAll(user.id, 3)
      .then((all) => {
        console.log(`[Home] Loaded ${all.length} recent ideas`);
        setRecent(all);
      })
      .catch((error) => {
        console.error("[Home] Recent ideas load error:", error);
        console.error("[Home] Error code:", error?.code);
        console.error("[Home] Error message:", error?.message);
        setRecent([]);
      });
  }, [pathname, user?.id]);

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

  const greeting = user?.firstName || user?.username || "there";

  return (
    <LinearGradient
      colors={["#070A12", "#0A1020", "#070A12"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>HII, {greeting}!</Text>
            <Text style={styles.subGreeting}>
              GOT ANY IDEA? LETS WORK ON IT
            </Text>
          </View>

          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(
                user?.firstName?.[0] ||
                user?.username?.[0] ||
                "U"
              ).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* own idea stats cards */}
        <View style={styles.statsRow}>
          <View style={styles.countCard}>
            <View style={styles.countCircle}>
              <Text style={styles.countNumber}>{ideaCount}</Text>
            </View>
            <Text style={styles.countLabel}>total ideas</Text>
          </View>

          <Pressable
            style={{ flex: 1 }}
            onPress={() =>
              router.push({
                pathname: "/workspace",
                params: { idea: "", category: "General" },
              })
            }
          >
            <LinearGradient
              colors={["#ffaa00", "#f8d800"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addCard}
            >
              <Text style={styles.addIcon}>+</Text>
              <Text style={styles.addLabel}>NEW IDEA</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recent.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No activity yet</Text>
          </View>
        ) : (
          recent.map((item) => (
            <Pressable
              key={item.id}
              style={styles.recentStrip}
              onPress={() =>
                router.push({
                  pathname: "/workspace",
                  params: {
                    idea: item.idea,
                    category: item.category,
                    id: item.id,
                  },
                })
              }
            >
              <Text style={styles.recentStripTitle}>{item.idea}</Text>
              <Text style={styles.recentStripCategory}>{item.category}</Text>
            </Pressable>
          ))
        )}

        <Text style={styles.sectionTitle}>CATEGORIES</Text>
        <View style={styles.actionGrid}>
          {["Startup", "Research", "Content Creation", "Growth"].map((cat) => (
            <Pressable
              key={cat}
              style={styles.actionCard}
              onPress={() =>
                router.push({
                  pathname: "/workspace",
                  params: { idea: "", category: cat },
                })
              }
            >
              <Text style={styles.actionText}>{cat}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: "#EAF0FF",
  },
  subGreeting: {
    fontSize: 14,
    color: "rgba(234,240,255,0.5)",
    marginTop: 4,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(109,94,246,0.3)",
    borderWidth: 2,
    borderColor: "#6D5EF6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6D5EF6",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  countCard: {
    flex: 0.8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(109,94,246,0.15)",
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  countCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(109,94,246,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  countNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#6D5EF6",
  },
  countLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(234,240,255,0.4)",
    textTransform: "uppercase",
  },
  addCard: {
    flex: 1,
    height: "100%",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#ffaa00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addIcon: {
    fontSize: 32,
    fontWeight: "300",
    color: "#080808",
    marginBottom: -4,
  },
  addLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#080808",
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#EAF0FF",
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(253, 251, 242, 0.94)",
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EAF0FF",
  },
  recentStrip: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(253, 251, 242, 0.15)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    minHeight: 60,
  },
  recentStripTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EAF0FF",
    flex: 1,
    marginRight: 12,
    flexWrap: "wrap",
  },
  recentStripCategory: {
    fontSize: 12,
    color: "rgba(234,240,255,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(109,94,246,0.15)",
    borderRadius: 8,
    flexShrink: 0,
  },
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: "center",
    marginBottom: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EAF0FF",
  },
});
