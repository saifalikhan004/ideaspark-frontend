import { WorkspaceStore } from "../storage/workspaceStore";
import { ChatStore } from "../storage/chatStore";
import { ActivityStore } from "../storage/activityStore";
import React, { useMemo, useState, useRef } from "react";
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
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";

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

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
};

export default function WorkspaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUser();
  const userId = user?.id || "anonymous";

  const initialIdea = (params.idea as string) || "";
  const initialCategory = (params.category as string) || "General";
  const existingId = params.id as string | undefined;

  
  const [idea, setIdea] = useState(initialIdea);
  const [category] = useState(initialCategory);
  const [notes, setNotes] = useState("");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [ideaDocId, setIdeaDocId] = useState<string | null>(existingId || null);
  const ideaDocIdRef = useRef<string | null>(existingId || null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  // Save idea to Firestore on mount & load existing data
  useEffect(() => {
    const init = async () => {
      if (existingId) {
        // Reopening existing idea — load chat history
        setIdeaDocId(existingId);
        ideaDocIdRef.current = existingId;
        const msgs = await ChatStore.getMessages(existingId);
        setChatMessages(msgs.map((m) => ({ role: m.role, content: m.content })));
      } else {
        // New idea — save to Firestore
        const docId = await WorkspaceStore.add(userId, {
          idea: initialIdea || "Untitled Idea",
          category: initialCategory,
        });
        setIdeaDocId(docId);
        ideaDocIdRef.current = docId;
        await ActivityStore.log(userId, {
          ideaId: docId,
          ideaTitle: (initialIdea || "Untitled Idea").slice(0, 50),
          action: "created",
        });
      }
    };
    init();
  }, []);

  // Save notes to Firestore when they change (debounced)
  useEffect(() => {
    const docId = ideaDocIdRef.current;
    if (!docId) return;
    const timer = setTimeout(() => {
      WorkspaceStore.update(docId, { notes });
    }, 1500);
    return () => clearTimeout(timer);
  }, [notes, ideaDocId]);

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

    // Save AI results to Firestore
    const currentDocId = ideaDocIdRef.current;
    if (currentDocId) {
      await WorkspaceStore.update(currentDocId, {
        idea,
        refinedIdea: data.refined_idea,
        subCategory: data.sub_category,
        expansions: data.expansions,
        actionSteps: data.action_steps,
        structureType: data.structure_type || null,
      });
      await ActivityStore.log(userId, {
        ideaId: currentDocId,
        ideaTitle: idea.slice(0, 50),
        action: "refined",
      });
    } else {
      console.warn("No ideaDocId available to save AI results");
    }
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


  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMsg = { role: "user", content: text };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea_context: idea,
          category: initialCategory,
          refined_idea: aiResult?.refined_idea || null,
          messages: updated,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const assistantMsg: ChatMsg = { role: "assistant", content: data.reply };
      setChatMessages((prev) => [...prev, assistantMsg]);

      // Save both messages to Firestore
      const docId = ideaDocIdRef.current;
      if (docId) {
        await ChatStore.addMessage(docId, userMsg);
        await ChatStore.addMessage(docId, assistantMsg);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
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
            <Text style={styles.refineText}>Refine</Text>
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

        {/* Chatbot Section */}
        <View style={styles.chatSection}>
          <Text style={styles.chatSectionTitle}>💬 Chat with AI about your idea</Text>

          <View style={styles.chatContainer}>
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
              onContentSizeChange={() =>
                chatScrollRef.current?.scrollToEnd({ animated: true })
              }
            >
              {chatMessages.length === 0 && (
                <Text style={styles.chatPlaceholder}>
                  Ask anything about your idea — brainstorm, explore challenges, get
                  feedback, or dive deeper.
                </Text>
              )}
              {chatMessages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.chatBubble,
                    msg.role === "user"
                      ? styles.chatBubbleUser
                      : styles.chatBubbleAI,
                  ]}
                >
                  <Text
                    style={[
                      styles.chatBubbleText,
                      msg.role === "user" && styles.chatBubbleTextUser,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}
              {chatLoading && (
                <View style={[styles.chatBubble, styles.chatBubbleAI]}>
                  <ActivityIndicator size="small" color="#6D5EF6" />
                </View>
              )}
            </ScrollView>

            <View style={styles.chatInputRow}>
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Type a message…"
                placeholderTextColor="rgba(234,240,255,0.35)"
                style={styles.chatInput}
                onSubmitEditing={handleChatSend}
                returnKeyType="send"
                editable={!chatLoading}
              />
              <Pressable
                onPress={handleChatSend}
                disabled={chatLoading || !chatInput.trim()}
                style={({ pressed }) => [
                  styles.chatSendBtn,
                  pressed && { opacity: 0.7 },
                  (!chatInput.trim() || chatLoading) && { opacity: 0.4 },
                ]}
              >
                <Text style={styles.chatSendText}>→</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
    color: "#f6ec5e",
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

  // Chat styles
  chatSection: {
    marginTop: 28,
  },
  chatSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EAF0FF",
    marginBottom: 12,
  },
  chatContainer: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(109,94,246,0.2)",
    overflow: "hidden",
  },
  chatMessages: {
    maxHeight: 350,
    minHeight: 120,
  },
  chatMessagesContent: {
    padding: 14,
    gap: 10,
  },
  chatPlaceholder: {
    color: "rgba(234,240,255,0.35)",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 24,
  },
  chatBubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  chatBubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#6D5EF6",
    borderBottomRightRadius: 4,
  },
  chatBubbleAI: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    color: "#EAF0FF",
    fontSize: 14,
    lineHeight: 20,
  },
  chatBubbleTextUser: {
    color: "#FFFFFF",
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chatInput: {
    flex: 1,
    color: "#EAF0FF",
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  chatSendBtn: {
    backgroundColor: "#ffaa00",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  chatSendText: {
    color: "#0A1020",
    fontSize: 18,
    fontWeight: "700",
  },
});