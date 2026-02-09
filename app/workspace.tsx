import { WorkspaceStore } from "../storage/workspaceStore";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

const BACKEND_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : "http://localhost:8000";

type AIResult = {
  refined_idea: string;
  final_category: string;
  sub_category: string;
  expansions: string[];
  action_steps: string[];
};
const params = useLocalSearchParams<{
  idea?: string;
  category?: string;
  id?: string;
}>();

const initialIdea = params.idea ?? "";
const initialCategory = params.category ?? "General";

const [idea, setIdea] = useState(initialIdea);
const [notes, setNotes] = useState("");
const [generated, setGenerated] = useState<string | null>(null);
const [saving, setSaving] = useState(false);

useEffect(() => {
  const id = params.id ?? Date.now().toString();

  WorkspaceStore.add({
    id,
    idea: initialIdea || "Untitled Idea",
    category: initialCategory,
    updatedAt: Date.now(),
  });
}, []);


export default function WorkspaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialIdea = (params.idea as string) || "";
  const initialCategory = (params.category as string) || "General";

  
  const [idea, setIdea] = useState(initialIdea);
  const [category] = useState(initialCategory);
  const [notes, setNotes] = useState("");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);

  const notesWordCount = useMemo(
    () => (notes.trim() ? notes.trim().split(/\s+/).length : 0),
    [notes]
  );

  const handleRefine = async () => {
  if (!idea.trim()) {
    Alert.alert("Idea required", "Please enter an idea before refining.");
    return;
  }

  try {
    setLoading(true);
    setAiResult(null);

    const res = await fetch(`${BACKEND_URL}/idea/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idea_text: idea,
        category: initialCategory, 
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to refine idea");
    }

    const data = await res.json();

    
    setAiResult(data);

    
  } catch (err) {
    console.error("Refine error:", err);
    Alert.alert(
      "Error",
      "Failed to refine idea. Please check backend connection."
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <LinearGradient
      colors={["#070A12", "#0A1020", "#070A12"]}
      style={styles.container}
    >
    
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <View style={styles.headerRight}>
          <Text style={styles.categoryChip}>{category}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
    
        <Text style={styles.label}>Idea</Text>
        <TextInput
          value={idea}
          onChangeText={setIdea}
          placeholder="Describe your idea…"
          placeholderTextColor="rgba(234,240,255,0.4)"
          multiline
          style={styles.ideaInput}
        />

        {/* ---------- NOTES ---------- */}
        <View style={styles.notesHeader}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.wordCount}>{notesWordCount}/1000 words</Text>
        </View>

        <TextInput
          value={notes}
          onChangeText={(text) => {
            if (text.split(/\s+/).length <= 1000) {
              setNotes(text);
            }
          }}
          placeholder="Write your thoughts, drafts, links, or ideas here…"
          placeholderTextColor="rgba(234,240,255,0.35)"
          multiline
          style={styles.notesInput}
        />

        
        <Pressable
          onPress={handleRefine}
          disabled={loading}
          style={({ pressed }) => [
            styles.refineButton,
            pressed && styles.pressed,
            loading && { opacity: 0.6 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#0A1020" />
          ) : (
            <Text style={styles.refineText}>Refine with AI</Text>
          )}
        </Pressable>

    
        {aiResult && (
          <View style={styles.aiSection}>
            <Text style={styles.aiTitle}>Refined Idea</Text>
            <Text style={styles.aiText}>{aiResult.refined_idea}</Text>

            <Text style={styles.aiSub}>
              {aiResult.final_category} → {aiResult.sub_category}
            </Text>

            <Text style={styles.aiTitle}>Expansion</Text>
            {aiResult.expansions.map((item, i) => (
              <Text key={i} style={styles.aiBullet}>
                • {item}
              </Text>
            ))}

            <Text style={styles.aiTitle}>Action Steps</Text>
            {aiResult.action_steps.map((step, i) => (
              <Text key={i} style={styles.aiBullet}>
                ✓ {step}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  back: {
    color: "#EAF0FF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryChip: {
    backgroundColor: "rgba(109,94,246,0.25)",
    color: "#6D5EF6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: "600",
  },

  content: {
    padding: 20,
    paddingBottom: 60,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EAF0FF",
    marginBottom: 8,
  },

  ideaInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
    color: "#EAF0FF",
    minHeight: 90,
    marginBottom: 20,
  },

  notesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordCount: {
    color: "rgba(234,240,255,0.4)",
    fontSize: 12,
  },
  notesInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 16,
    color: "#EAF0FF",
    minHeight: 180,
    marginBottom: 24,
  },

  refineButton: {
    backgroundColor: "#ffaa00",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 28,
  },
  refineText: {
    color: "#0A1020",
    fontSize: 16,
    fontWeight: "700",
  },

  aiSection: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#EAF0FF",
    marginTop: 10,
  },
  aiSub: {
    color: "rgba(234,240,255,0.6)",
    fontSize: 13,
  },
  aiText: {
    color: "#EAF0FF",
    fontSize: 14,
    lineHeight: 20,
  },
  aiBullet: {
    color: "#EAF0FF",
    fontSize: 14,
    lineHeight: 20,
  },

  pressed: {
    opacity: 0.85,
  },
});