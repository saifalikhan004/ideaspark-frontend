import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Workspace, WorkspaceStore } from "../../storage/workspaceStore";

export default function RecentScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [items, setItems] = React.useState<Workspace[]>([]);

  const loadItems = React.useCallback(() => {
    if (user?.id) {
      WorkspaceStore.getAll(user.id)
        .then(setItems)
        .catch((error) => {
          console.error("Recent screen load error:", error);
          setItems([]);
        });
    }
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      "Delete Idea",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            if (!user?.id) return;
            try {
              await WorkspaceStore.delete(user.id, id);
              loadItems();
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Failed to delete the idea.");
            }
          }
        }
      ]
    );
  };

  return (
    <LinearGradient
      colors={["#070A12", "#0A1020", "#070A12"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Recent Workspaces</Text>

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No workspaces yet</Text>
          </View>
        ) : (
          items.map((w) => (
            <Pressable
              key={w.id}
              style={styles.recentStrip}
              onPress={() =>
                router.push({
                  pathname: "/workspace",
                  params: { category: w.category, idea: w.idea, id: w.id },
                })
              }
            >
              <View style={styles.stripLeft}>
                <Text style={styles.recentStripTitle}>{w.idea}</Text>
                <Text style={styles.recentStripCategory}>{w.category}</Text>
              </View>
              
              <Pressable 
                onPress={() => handleDelete(w.id, w.idea)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#FF4D4D" />
              </Pressable>
            </Pressable>
          ))
        )}
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
  sectionTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#EAF0FF",
    marginBottom: 24,
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
    minHeight: 60,
  },
  stripLeft: {
    flex: 1,
    marginRight: 12,
  },
  recentStripTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EAF0FF",
    marginBottom: 6,
  },
  recentStripCategory: {
    fontSize: 11,
    color: "rgba(234,240,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 77, 77, 0.1)",
    alignItems: "center",
    justifyContent: "center",
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
