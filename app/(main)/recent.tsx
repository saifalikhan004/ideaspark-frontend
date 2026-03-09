import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { Workspace, WorkspaceStore } from "../../storage/workspaceStore";
import { useUser } from "@clerk/clerk-expo";

export default function RecentScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [items, setItems] = React.useState<Workspace[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        WorkspaceStore.getAll(user.id).then(setItems);
      }
    }, [user?.id])
  );

  return (
    <LinearGradient
      colors={["#070A12", "#0A1020", "#070A12"]}
      style={{ flex: 1, padding: 24, paddingTop: 60 }}
    >
      <Text style={{ fontSize: 22, color: "#EAF0FF", marginBottom: 20 }}>
        Recent Workspaces
      </Text>

      <ScrollView>
        {items.length === 0 ? (
          <Text style={{ opacity: 0.5 }}>No workspaces yet</Text>
        ) : (
          items.map((w) => (
            <Pressable
              key={w.id}
              onPress={() =>
                router.push({
                  pathname: "/workspace" as any,
                  params: { category: w.category, idea: w.idea, id: w.id },
                })
              }
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 10,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(253, 251, 242, 0.15)",
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#EAF0FF", fontSize: 14, fontWeight: "600" }}>{w.idea}</Text>
              <Text style={{ color: "rgba(234,240,255,0.45)", fontSize: 12 }}>{w.category}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}