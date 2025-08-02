import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  SlideInDown,
  FadeInUp,
  SlideInRight,
  BounceIn,
} from "react-native-reanimated";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleChangePassword = async () => {
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      setMessage("Please fill in all fields");
      setIsSuccess(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("New password must be at least 6 characters long");
      setIsSuccess(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password do not match");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage(null);
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setMessage("User not found. Please log in again");
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    try {
      // Re-authenticate user
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      setMessage("Password updated successfully!");
      setIsSuccess(true);

      // Clear form and redirect after 2 seconds
      setTimeout(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        router.push("/shops");
      }, 2000);
    } catch (error) {
      setIsSuccess(false);
      switch (error.code) {
        case "auth/wrong-password":
          setMessage("Current password is incorrect");
          break;
        case "auth/weak-password":
          setMessage(
            "New password is too weak. Please choose a stronger password"
          );
          break;
        case "auth/requires-recent-login":
          setMessage(
            "Please log out and log in again before changing password"
          );
          break;
        default:
          setMessage("Failed to update password. Please try again");
      }
    } finally {
      setLoading(false);
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
            <Ionicons name="key" size={60} color="#4f46e5" />
          </View>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>
            Enter your current password and choose a new secure password
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={styles.formCard}
        >
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#6b7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!currentPasswordVisible}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setCurrentPasswordVisible(!currentPasswordVisible)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={
                  currentPasswordVisible ? "eye-off-outline" : "eye-outline"
                }
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("/forgetpassword")}>
            <Text style={styles.forgotPasswordText}>
              Don't remember your password?
            </Text>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-open-outline"
              size={20}
              color="#6b7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!newPasswordVisible}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setNewPasswordVisible(!newPasswordVisible)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={newPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#6b7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!confirmPasswordVisible}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={
                  confirmPasswordVisible ? "eye-off-outline" : "eye-outline"
                }
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
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
                styles.updateButton,
                loading && styles.updateButtonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="key" size={20} color="#ffffff" />
                  <Text style={styles.updateButtonText}>Update Password</Text>
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
  eyeButton: {
    padding: 4,
  },
  forgotPasswordText: {
    color: "#4f46e5",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    textDecorationLine: "underline",
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
  updateButton: {
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  updateButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  updateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
