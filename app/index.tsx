import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";

const BACKEND_URL = "http://localhost:8000";

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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>IdeaSpark</Text>

      <TextInput
        placeholder="Enter your idea..."
        value={idea}
        onChangeText={setIdea}
        style={styles.input}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={sendToBackend}>
        <Text style={styles.buttonText}>
          {loading ? "Processing..." : "SEND TO BACKEND"}
        </Text>
      </TouchableOpacity>

      {response && (
        <View style={styles.resultBox}>
          <Text style={styles.sectionTitle}>Refined Idea</Text>
          <Text>{response.refined_idea}</Text>

          <Text style={styles.sectionTitle}>Category</Text>
          <Text>
            {response.final_category} → {response.sub_category}
          </Text>

          <Text style={styles.sectionTitle}>Expansion</Text>
          {response.expansions?.map((item: string, index: number) => (
            <Text key={index}>• {item}</Text>
          ))}

          <Text style={styles.sectionTitle}>Action Steps</Text>
          {response.action_steps?.map((step: string, index: number) => (
            <Text key={index}>✅ {step}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    maxWidth: 600,
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#1e90ff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  resultBox: {
    marginTop: 30,
    backgroundColor: "#f3f3f3",
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    marginTop: 16,
    fontWeight: "bold",
  },
});