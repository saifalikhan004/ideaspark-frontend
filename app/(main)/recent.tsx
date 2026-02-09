import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { Workspace, WorkspaceStore } from "../../storage/workspaceStore";

export default function RecentScreen() {
  const router = useRouter();
  const [items, setItems] = React.useState<Workspace[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      WorkspaceStore.getAll().then(setItems);
    }, [])
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
                  params: { category: w.category },
                })
              }
              style={{
                padding: 16,
                marginBottom: 12,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 14,
              }}
            >
              <Text style={{ color: "#EAF0FF" }}>{w.idea}</Text>
              <Text style={{ opacity: 0.5 }}>{w.category}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}