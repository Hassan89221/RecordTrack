import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase.config";
import { useRouter } from "expo-router";
import Animated, {
  SlideInDown,
  FadeInUp,
  SlideInRight,
  BounceIn,
} from "react-native-reanimated";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setMessage("Please enter your email address");
      setIsSuccess(false);
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setMessage("Please enter a valid email address");
      setIsSuccess(false);
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link sent to your email successfully!");
      setIsSuccess(true);
    } catch (error) {
      setIsSuccess(false);
      switch (error.code) {
        case "auth/user-not-found":
          setMessage("No account found with this email address");
          break;
        case "auth/invalid-email":
          setMessage("Please enter a valid email address");
          break;
        case "auth/too-many-requests":
          setMessage("Too many requests. Please try again later");
          break;
        default:
          setMessage("Error sending reset email. Please try again");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4f46e5" barStyle="light-content" />
      {/* Background */}
      <Image
        source={require("../assets/Deer.jpg")}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay} />

      {/* Header Section (match login) */}
      <Animated.View
        style={styles.headerSection}
        entering={FadeInUp.duration(800)}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Animated.View
            style={styles.logoIcon}
            entering={BounceIn.delay(400).duration(1000)}
          >
            <MaterialIcons name="analytics" size={32} color="white" />
          </Animated.View>
          <Text style={styles.logoText}>RecordTrack</Text>
        </View>
      </Animated.View>

      {/* Form Card (match login) */}
      <Animated.View
        style={styles.formCard}
        entering={SlideInDown.delay(600).duration(800)}
      >
        <Text style={styles.welcomeTitle}>Reset Password</Text>
        <Text style={styles.welcomeSubtitle}>
          Enter your email address and we'll send you a link to reset your
          password
        </Text>
        {/* Email Input */}
        <Animated.View
          style={styles.inputGroup}
          entering={SlideInRight.delay(800).duration(600)}
        >
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#6b7280" />
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </Animated.View>

        {/* Error/Success Message */}
        {message && (
          <Animated.View
            style={[
              isSuccess ? styles.successContainer : styles.errorContainer,
            ]}
            entering={FadeInUp.duration(300)}
          >
            <MaterialIcons
              name={isSuccess ? "check-circle" : "error-outline"}
              size={20}
              color={isSuccess ? "#059669" : "#ef4444"}
            />
            <Text style={isSuccess ? styles.successText : styles.errorText}>
              {message}
            </Text>
          </Animated.View>
        )}

        {/* Reset Button */}
        <Animated.View
          style={styles.buttonContainer}
          entering={BounceIn.delay(1400).duration(800)}
        >
          <TouchableOpacity
            onPress={handleResetPassword}
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.loadingText}>Sending...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.loginButtonText}>Send Reset Link</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(79, 70, 229, 0.85)",
  },
  headerSection: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginRight: 40, // Compensate for back button
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginHorizontal: 20,
    marginTop: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    paddingVertical: 12,
    paddingLeft: 12,
  },
  // Error/Success Handling
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  successText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  // Button
  buttonContainer: {
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
    elevation: 2,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
});
