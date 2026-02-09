import { useSignUp, useSSO } from "@clerk/clerk-expo";
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

export default function RegisterScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [username, setUsername] = React.useState("");
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pw))
      return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pw))
      return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(pw)) return "Password must contain at least one number";
    if (!/[^A-Za-z0-9]/.test(pw))
      return "Password must contain at least one special character (!@#$%^&*)";
    return null;
  };

  const onSignUpPress = async () => {
    if (!isLoaded || !signUp) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      await signUp.create({
        username,
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      const clerkMessage =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Something went wrong";
      // Provide a friendlier message for breached password errors
      if (
        clerkMessage.toLowerCase().includes("data breach") ||
        clerkMessage.toLowerCase().includes("pwned")
      ) {
        setError(
          "This password has been found in a data breach. Please choose a stronger, unique password.",
        );
      } else {
        setError(clerkMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded || !signUp || !setActive) return;

    setError("");
    setLoading(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/(main)/home" as any);
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid verification code";
      setError(message);
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

  // Email verification screen
  if (pendingVerification) {
    return (
      <LinearGradient
        colors={["#070A12", "#0A1020", "#070A12"]}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inner}
        >
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We sent a verification code to {emailAddress}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            value={code}
            placeholder="Enter 6-digit code"
            placeholderTextColor="rgba(234,240,255,0.4)"
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <Pressable
            onPress={onVerifyPress}
            disabled={loading || !code}
            style={({ pressed }) => [
              pressed && styles.buttonPressed,
              (!code || loading) && styles.buttonDisabled,
            ]}
          >
            <LinearGradient
              colors={["#6D5EF6", "#8B5CF6"]}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify Email</Text>
              )}
            </LinearGradient>
          </Pressable>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // Registration form
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>BRING IDEAS TOGETHER</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Google Sign Up */}
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

          {/* Username */}
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={username}
            placeholder="Choose a username"
            placeholderTextColor="rgba(234,240,255,0.4)"
            onChangeText={setUsername}
          />

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
            placeholder="Min. 8 chars, upper, lower, number, special"
            placeholderTextColor="rgba(234,240,255,0.4)"
            secureTextEntry
            onChangeText={setPassword}
          />
          {password.length > 0 && (
            <View style={styles.passwordHints}>
              <Text
                style={[
                  styles.hintText,
                  password.length >= 8 && styles.hintValid,
                ]}
              >
                {" "}
                {password.length >= 8 ? "\u2713" : "\u2717"} 8+ characters
              </Text>
              <Text
                style={[
                  styles.hintText,
                  /[A-Z]/.test(password) && styles.hintValid,
                ]}
              >
                {" "}
                {/[A-Z]/.test(password) ? "\u2713" : "\u2717"} Uppercase
              </Text>
              <Text
                style={[
                  styles.hintText,
                  /[a-z]/.test(password) && styles.hintValid,
                ]}
              >
                {" "}
                {/[a-z]/.test(password) ? "\u2713" : "\u2717"} Lowercase
              </Text>
              <Text
                style={[
                  styles.hintText,
                  /[0-9]/.test(password) && styles.hintValid,
                ]}
              >
                {" "}
                {/[0-9]/.test(password) ? "\u2713" : "\u2717"} Number
              </Text>
              <Text
                style={[
                  styles.hintText,
                  /[^A-Za-z0-9]/.test(password) && styles.hintValid,
                ]}
              >
                {" "}
                {/[^A-Za-z0-9]/.test(password) ? "\u2713" : "\u2717"} Special
                char
              </Text>
            </View>
          )}

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            placeholder="Re-enter your password"
            placeholderTextColor="rgba(234,240,255,0.4)"
            secureTextEntry
            onChangeText={setConfirmPassword}
          />

          {/* Sign Up Button */}
          <Pressable
            onPress={onSignUpPress}
            disabled={
              loading ||
              !emailAddress ||
              !password ||
              !confirmPassword ||
              !username
            }
            style={({ pressed }) => [
              pressed && styles.buttonPressed,
              (loading ||
                !emailAddress ||
                !password ||
                !confirmPassword ||
                !username) &&
                styles.buttonDisabled,
            ]}
          >
            <LinearGradient
              colors={["#6D5EF6", "#8B5CF6"]}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Link to Login */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Link href={"/(auth)/login" as any}>
              <Text style={styles.linkAction}>Sign in</Text>
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
  passwordHints: {
    marginTop: 6,
    gap: 2,
  },
  hintText: {
    fontSize: 12,
    color: "rgba(255,107,107,0.7)",
  },
  hintValid: {
    color: "rgba(107,255,130,0.8)",
  },
});
