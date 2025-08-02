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
  ScrollView,
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={SlideInDown.delay(100).springify()}
          style={styles.headerContainer}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#4f46e5" />
          </TouchableOpacity>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={60} color="#4f46e5" />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your
            password
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={styles.formCard}
        >
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#6b7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {message && (
            <Animated.View
              entering={SlideInRight.springify()}
              style={[
                styles.messageContainer,
                isSuccess ? styles.successContainer : styles.errorContainer,
              ]}
            >
              <Ionicons
                name={isSuccess ? "checkmark-circle" : "alert-circle"}
                size={16}
                color={isSuccess ? "#059669" : "#dc2626"}
              />
              <Text
                style={[
                  styles.messageText,
                  isSuccess ? styles.successText : styles.errorText,
                ]}
              >
                {message}
              </Text>
            </Animated.View>
          )}

          <Animated.View entering={BounceIn.delay(500)}>
            <TouchableOpacity
              style={[
                styles.resetButton,
                isLoading && styles.resetButtonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={20} color="#ffffff" />
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    padding: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successContainer: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
    borderWidth: 1,
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderColor: "#ef4444",
    borderWidth: 1,
  },
  messageText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  successText: {
    color: "#059669",
  },
  errorText: {
    color: "#dc2626",
  },
  resetButton: {
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  resetButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  resetButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
