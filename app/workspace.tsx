import { useUser } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ActivityStore } from "../storage/activityStore";
import { ChatStore } from "../storage/chatStore";
import { Note, NotesStore } from "../storage/notesStore";
import { WorkspaceStore } from "../storage/workspaceStore";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [ideaDocId, setIdeaDocId] = useState<string | null>(existingId || null);
  const ideaDocIdRef = useRef<string | null>(existingId || null);
  const [initReady, setInitReady] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<any>(null);
  const mainScrollRef = useRef<any>(null);

  // Keyboard padding for Android
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardPadding(e.endCoordinates.height);
        // Scroll main view to bottom so chat input is visible
        setTimeout(
          () => mainScrollRef.current?.scrollToEnd({ animated: true }),
          150,
        );
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardPadding(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Save idea to Firestore on mount & load existing data
  useEffect(() => {
    const init = async () => {
      try {
        if (existingId) {
          // Reopening existing idea — load chat history, notes, and AI results
          setIdeaDocId(existingId);
          ideaDocIdRef.current = existingId;

          // Load full idea document including refined idea, expansions, action steps
          const ideaData = await WorkspaceStore.get(userId, existingId);
          if (ideaData) {
            console.log("📖 Loaded existing idea:", ideaData);
            // Set idea text
            setIdea(ideaData.idea || "");

            // Set AI results if they exist
            if (ideaData.refinedIdea) {
              setAiResult({
                final_category: ideaData.category || "",
                sub_category: ideaData.subCategory || "",
                refined_idea: ideaData.refinedIdea || "",
                expansions: ideaData.expansions || [],
                action_steps: ideaData.actionSteps || [],
              });
              console.log("✅ AI results loaded");
            }
          }

          // Load chat history
          const msgs = await ChatStore.getMessages(userId, existingId);
          setChatMessages(
            msgs.map((m) => ({ role: m.role, content: m.content })),
          );

          // Load notes
          setNotesLoading(true);
          const notesList = await NotesStore.getNotes(userId, existingId);
          setNotes(notesList);
          setNotesLoading(false);
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
        setInitReady(true);
      } catch (error) {
        setInitReady(true);
        console.error("Workspace init error:", error);
      }
    };
    void init();
  }, []);

  // No longer needed - notes are saved individually as documents now
  const notesWordCount = 0;

  // Notes handlers
  const handleAddNote = async () => {
    const text = newNoteText.trim();
    if (!text) {
      Alert.alert("Empty note", "Please enter some text for your note.");
      return;
    }

    try {
      setNotesLoading(true);
      const docId = ideaDocIdRef.current;
      if (!docId) {
        Alert.alert("Error", "Idea not ready. Please wait.");
        return;
      }
      await NotesStore.addNote(userId, docId, text);
      // Reload notes
      const notesList = await NotesStore.getNotes(userId, docId);
      setNotes(notesList);
      setNewNoteText("");
    } catch (error) {
      console.error("Error adding note:", error);
      Alert.alert("Error", "Failed to add note. Please try again.");
    } finally {
      setNotesLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    Alert.alert("Delete note", "Are you sure?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            setNotesLoading(true);
            const docId = ideaDocIdRef.current;
            if (!docId) return;
            await NotesStore.deleteNote(userId, docId, noteId);
            // Reload notes
            const notesList = await NotesStore.getNotes(userId, docId);
            setNotes(notesList);
          } catch (error) {
            console.error("Error deleting note:", error);
            Alert.alert("Error", "Failed to delete note.");
          } finally {
            setNotesLoading(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  // Wait for DocId
  const waitForDocId = useCallback(async (): Promise<string | null> => {
    if (ideaDocIdRef.current) return ideaDocIdRef.current;
    // Wait up to 5 seconds for init
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (ideaDocIdRef.current) return ideaDocIdRef.current;
    }
    return null;
  }, []);

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
        throw new Error("Server error");
      }

      const data = await res.json();
      setAiResult(data);

      const currentDocId = await waitForDocId();
      if (currentDocId) {
        try {
          await WorkspaceStore.update(userId, currentDocId, {
            idea,
            refinedIdea: data.refined_idea,
            subCategory: data.sub_category,
            expansions: data.expansions,
            actionSteps: data.action_steps,
            structureType: data.structure_type || null,
          });
        } catch (saveError) {
          console.error("Save error:", saveError);
        }

        await ActivityStore.log(userId, {
          ideaId: currentDocId,
          ideaTitle: idea.slice(0, 50),
          action: "refined",
        });
      }
    } catch (err: any) {
      console.error("Refine error:", err);
      let msg = "Failed to refine idea. Please try again.";
      if (err.message?.includes("Network request failed") || !err.message) {
        msg = `Could not connect to the AI server. Is the backend running at ${BACKEND_URL}?`;
      }
      Alert.alert("Refinement Failed", msg);
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
        await ChatStore.addMessage(userId, docId, userMsg);
        await ChatStore.addMessage(userId, docId, assistantMsg);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(
        () => chatScrollRef.current?.scrollToEnd({ animated: true }),
        100,
      );
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
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: keyboardPadding + 60 },
        ]}
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
          <Text style={styles.wordCount}>{notes.length} note(s)</Text>
        </View>

        <View style={styles.notesInputContainer}>
          <TextInput
            value={newNoteText}
            onChangeText={setNewNoteText}
            placeholder="Write a note…"
            placeholderTextColor="rgba(234,240,255,0.35)"
            multiline
            style={styles.noteInputField}
          />
          <Pressable
            onPress={handleAddNote}
            disabled={notesLoading || !newNoteText.trim()}
            style={({ pressed }) => [
              styles.addNoteButton,
              pressed && { opacity: 0.7 },
              (notesLoading || !newNoteText.trim()) && { opacity: 0.4 },
            ]}
          >
            {notesLoading ? (
              <ActivityIndicator size="small" color="#0A1020" />
            ) : (
              <Text style={styles.addNoteText}>+</Text>
            )}
          </Pressable>
        </View>

        {notes.length > 0 && (
          <View style={styles.notesList}>
            {notes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <Text style={styles.noteContent}>{note.content}</Text>
                <Pressable
                  onPress={() => handleDeleteNote(note.id!)}
                  style={styles.deleteNoteButton}
                >
                  <Text style={styles.deleteNoteText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

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
          <Text style={styles.chatSectionTitle}>
            💬 Chat with AI about your idea
          </Text>

          <View style={styles.chatContainer}>
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              onContentSizeChange={() =>
                chatScrollRef.current?.scrollToEnd({ animated: true })
              }
            >
              {chatMessages.length === 0 && (
                <Text style={styles.chatPlaceholder}>
                  Ask anything about your idea — brainstorm, explore challenges,
                  get feedback, or dive deeper.
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
    marginBottom: 12,
  },
  wordCount: {
    color: "rgba(234,240,255,0.4)",
    fontSize: 12,
  },
  notesInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  noteInputField: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 12,
    color: "#EAF0FF",
    minHeight: 50,
    maxHeight: 100,
  },
  addNoteButton: {
    backgroundColor: "#6D5EF6",
    borderRadius: 14,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  addNoteText: {
    color: "#0A1020",
    fontSize: 28,
    fontWeight: "bold",
  },
  notesList: {
    gap: 10,
    marginBottom: 24,
  },
  noteCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  noteContent: {
    flex: 1,
    color: "#EAF0FF",
    fontSize: 14,
    lineHeight: 20,
    marginRight: 8,
  },
  deleteNoteButton: {
    padding: 4,
  },
  deleteNoteText: {
    color: "rgba(234,240,255,0.5)",
    fontSize: 24,
    fontWeight: "bold",
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
    maxHeight: 500,
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
