import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function LandingScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#070A12", "#0A1020", "#070A12"]}
      style={styles.container}
    >
      <LinearGradient
        colors={[
          "rgba(109,94,246,0.25)",
          "rgba(88,215,255,0.10)",
          "transparent",
        ]}
        style={styles.glow}
      />

      <Image
        source={require("../assets/images/logoidea.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>IdeaSpark</Text>

      <Text style={styles.motto}>Turn Ideas into Reality</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/(auth)/register" as any)}
      >
        <LinearGradient colors={["#6D5EF6", "#8B5CF6"]} style={styles.button}>
          <Text style={styles.buttonText}>Get Started</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#EAF0FF",
    marginBottom: 6,
  },
  motto: {
    fontSize: 15,
    color: "rgba(234,240,255,0.72)",
    marginBottom: 42,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 44,
    borderRadius: 28,
    shadowColor: "#6D5EF6",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
