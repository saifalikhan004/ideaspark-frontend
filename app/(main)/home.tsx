import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, usePathname } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestoreDB } from "../../FirebaseConfig";

import { WorkspaceStore, Workspace } from "../../storage/workspaceStore";

export default function HomeScreen() {
  
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [ideaCount, setIdeaCount] = useState(0);
  const [recent, setRecent] = useState<Workspace[]>([]);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Ensure user doc exists in Firestore
    const userRef = doc(firestoreDB, "users", user.id);
    setDoc(
      userRef,
      {
        username: user.username || user.firstName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    WorkspaceStore.count(user.id).then(setIdeaCount);
    WorkspaceStore.getAll(user.id).then((all) => {
      setRecent(all.slice(0, 3));
    });
  }, [pathname, user?.id]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)/login" as any);
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
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

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard1}>
            <Text style={styles.statNumber}>{ideaCount}</Text>
            <Text style={styles.statLabel1}>Ideas</Text>
          </View>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/workspace" as any,
                params: { idea: "", category: "General" },
              })
            }
          >
            <View style={styles.statCard2}>
              <Text style={styles.statNumber}>+</Text>
              <Text style={styles.statLabel2}>HAVE AN IDEA</Text>
            </View>
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
                  pathname: "/workspace" as any,
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
          {["Startup", "Research", "Content Creation", "Growth"].map(
            (cat) => (
              <Pressable
                key={cat}
                style={styles.actionCard}
                onPress={() =>
                  router.push({
                    pathname: "/workspace" as any,
                    params: { idea: "", category: cat },
                  })
                }
              >
                <Text style={styles.actionText}>{cat}</Text>
              </Pressable>
            )
          )}
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
    gap: 20,
    marginBottom: 28,
  },
  statCard1: {
    width: 100,
    height: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(109,94,246,0.2)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statCard2: {
    height: 100,
    backgroundColor: "#ffaa00",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6D5EF6",
  },
  statLabel1: {
    fontSize: 18,
    color: "#EAF0FF",
    marginTop: 4,
  },
  statLabel2: {
    fontSize: 18,
    color: "#080808",
    marginTop: 4,
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
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(253, 251, 242, 0.15)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  recentStripTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EAF0FF",
  },
  recentStripCategory: {
    fontSize: 12,
    color: "rgba(234,240,255,0.45)",
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