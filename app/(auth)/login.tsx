import { useSignIn, useSSO } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as React from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// Required for OAuth on Android/web
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const onSignInPress = async () => {
    if (!isLoaded || !signIn || !setActive) return;

    if (!emailAddress.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress.trim(),
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(main)/home" as any);
      } else {
        setError("Sign-in could not be completed. Please try again.");
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      const clerkMessage =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid email or password";
      // Friendly message for breached password errors
      if (
        clerkMessage.toLowerCase().includes("data breach") ||
        clerkMessage.toLowerCase().includes("pwned")
      ) {
        setError(
          "Your password was found in a data breach. Please reset your password or use Google sign-in.",
        );
      } else if (clerkMessage.toLowerCase().includes("identifier")) {
        setError("No account found with this email. Please check or sign up.");
      } else {
        setError(clerkMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const onGooglePress = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
        router.replace("/(main)/home" as any);
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Google sign-in failed";
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#070A12", "#0A1020", "#070A12"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your IdeaSpark account</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Google Sign In */}
          <Pressable
            onPress={onGooglePress}
            disabled={googleLoading}
            style={({ pressed }) => [
              pressed && styles.buttonPressed,
              googleLoading && styles.buttonDisabled,
            ]}
          >
            <View style={styles.googleButton}>
              {googleLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </>
              )}
            </View>
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Enter your email"
            placeholderTextColor="rgba(234,240,255,0.4)"
            onChangeText={setEmailAddress}
            keyboardType="email-address"
          />

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            placeholder="Enter your password"
            placeholderTextColor="rgba(234,240,255,0.4)"
            secureTextEntry
            onChangeText={setPassword}
          />

          {/* Sign In Button */}
          <Pressable
            onPress={onSignInPress}
            disabled={loading || !emailAddress || !password}
            style={({ pressed }) => [
              pressed && styles.buttonPressed,
              (loading || !emailAddress || !password) && styles.buttonDisabled,
            ]}
          >
            <LinearGradient
              colors={["#6D5EF6", "#8B5CF6"]}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Link to Register */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Link href={"/(auth)/register" as any}>
              <Text style={styles.linkAction}>Sign up</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  scrollContent: {
    paddingVertical: 60,
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#EAF0FF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(234,240,255,0.6)",
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(234,240,255,0.7)",
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(109,94,246,0.25)",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#EAF0FF",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  googleButtonText: {
    color: "#EAF0FF",
    fontSize: 15,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  dividerText: {
    color: "rgba(234,240,255,0.4)",
    marginHorizontal: 12,
    fontSize: 13,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
    marginBottom: 8,
    textAlign: "center",
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  linkText: {
    color: "rgba(234,240,255,0.6)",
    fontSize: 14,
  },
  linkAction: {
    color: "#6D5EF6",
    fontSize: 14,
    fontWeight: "600",
  },
});
