import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import Animated, {
  SlideInDown,
  FadeInUp,
  SlideInRight,
  BounceIn,
} from "react-native-reanimated";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

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
          onPress={() => router.push("/shops")}
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
        style={styles.formContainer}
        entering={SlideInDown.delay(600).duration(800)}
      >
        <View style={styles.formCard}>
          <Text style={styles.welcomeTitle}>Change Password</Text>
          <Text style={styles.welcomeSubtitle}>
            Enter your current password and choose a new secure password
          </Text>

          {/* Current Password */}
          <Animated.View
            style={styles.inputGroup}
            entering={SlideInRight.delay(800).duration(600)}
          >
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6b7280" />
              <TextInput
                placeholder="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!currentPasswordVisible}
                style={styles.input}
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={() =>
                  setCurrentPasswordVisible(!currentPasswordVisible)
                }
                style={styles.eyeButton}
              >
                <Ionicons
                  name={currentPasswordVisible ? "eye-off" : "eye"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Forgot Password Link */}
          <Animated.View
            style={styles.forgotContainer}
            entering={FadeInUp.delay(1200).duration(600)}
          >
            <TouchableOpacity onPress={() => router.push("/forgetpassword")}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* New Password */}
          <Animated.View
            style={styles.inputGroup}
            entering={SlideInRight.delay(1000).duration(600)}
          >
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6b7280" />
              <TextInput
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!newPasswordVisible}
                style={styles.input}
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={() => setNewPasswordVisible(!newPasswordVisible)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={newPasswordVisible ? "eye-off" : "eye"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Confirm Password */}
          <Animated.View
            style={styles.inputGroup}
            entering={SlideInRight.delay(1200).duration(600)}
          >
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6b7280" />
              <TextInput
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!confirmPasswordVisible}
                style={styles.input}
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                }
                style={styles.eyeButton}
              >
                <Ionicons
                  name={confirmPasswordVisible ? "eye-off" : "eye"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
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

          {/* Update Button */}
          <Animated.View
            style={styles.buttonContainer}
            entering={BounceIn.delay(1400).duration(800)}
          >
            <TouchableOpacity
              onPress={handleChangePassword}
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.loadingText}>Updating...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.loginButtonText}>Update Password</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
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
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: -50,
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
  eyeButton: {
    padding: 8,
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
  // Forgot Password
  forgotContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: "600",
  },
  // Buttons
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
