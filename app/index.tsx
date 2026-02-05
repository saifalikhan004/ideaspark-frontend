import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BACKEND_URL = "http://localhost:8000"; 

const COLORS = {
  bg: "#0B1220",
  surface: "#121B2E",
  surface2: "#0F172A",
  border: "#24324A",
  text: "#EAF0FF",
  muted: "#A8B3CF",
  primary: "#7C3AED",
  primary2: "#2563EB",
  success: "#22C55E",
} as const;

export default function Index() {
  const [idea, setIdea] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const sendToBackend = async () => {
    if (!idea.trim()) {
      Alert.alert("Error", "Please enter an idea");
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${BACKEND_URL}/idea/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "General",
          idea_text: idea,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const data = await res.json();
      setResponse(data);
    } catch (error: any) {
      console.error("Fetch error:", error);
      Alert.alert("Fetch Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brandRow}>
        <Image
          source={require("../assets/images/logoidea.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="IdeaSpark logo"
        />
        <View style={styles.brandText}>
          <Text style={styles.title}>IdeaSpark</Text>
          <Text style={styles.subtitle}>Turn ideas into action.</Text>
        </View>
      </View>

      <TextInput
        placeholder="Enter your idea..."
        value={idea}
        onChangeText={setIdea}
        style={styles.input}
        multiline
        placeholderTextColor={COLORS.muted}
        selectionColor={COLORS.primary}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={sendToBackend}
        disabled={loading}
        activeOpacity={0.9}
      >
        <Text style={styles.buttonText}>
          {loading ? "Processing..." : "LETS WORK ON YOUR IDEA"}
        </Text>
      </TouchableOpacity>

      {response && (
        <View style={styles.resultBox}>
          <Text style={styles.sectionTitle}>Refined Idea</Text>
          <Text style={styles.bodyText}>{response.refined_idea}</Text>

          <Text style={styles.sectionTitle}>Category</Text>
          <Text style={styles.bodyText}>
            {response.final_category} → {response.sub_category}
          </Text>

          <Text style={styles.sectionTitle}>Expansion</Text>
          {response.expansions?.map((item: string, index: number) => (
            <Text key={index} style={styles.bodyText}>
              • {item}
            </Text>
          ))}

          <Text style={styles.sectionTitle}>Action Steps</Text>
          {response.action_steps?.map((step: string, index: number) => (
            <Text key={index} style={styles.bodyText}>
              <Text style={styles.successMark}>✓ </Text>
              {step}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: 24,
    paddingTop: 44,
    maxWidth: 600,
    alignSelf: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  brandText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 2,
    color: COLORS.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 100,
    maxWidth: 600,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: "bold",
    letterSpacing: 0.4,
  },
  resultBox: {
    marginTop: 30,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    marginTop: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  bodyText: {
    marginTop: 6,
    color: COLORS.muted,
    lineHeight: 20,
  },
  successMark: {
    color: COLORS.success,
    fontWeight: "700",
  },
});