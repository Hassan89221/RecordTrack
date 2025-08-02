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
import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase.config";
import { useRouter } from "expo-router";
import { db } from "../firebase.config";
import { doc, setDoc } from "firebase/firestore";
import Animated, {
  SlideInDown,
  FadeInUp,
  SlideInRight,
  BounceIn,
} from "react-native-reanimated";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

export default function signup() {
  const router = useRouter();
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reconfirmpassword, setReConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [repasswordVisible, setRePasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (setter) => (value) => {
    setter(value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  const handleSignup = async () => {
    if (
      !firstname.trim() ||
      !lastname.trim() ||
      !email.trim() ||
      !password.trim() ||
      !reconfirmpassword.trim()
    ) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }

    if (password !== reconfirmpassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);
      setEmailSent(true);

      // Save user details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstname,
        lastName: lastname,
        email: email,
        createdAt: new Date(),
      });

      // Clear input fields
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setReConfirmPassword("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "An account with this email already exists";
      case "auth/invalid-email":
        return "Please enter a valid email address";
      case "auth/weak-password":
        return "Password should be at least 6 characters";
      default:
        return "Registration failed. Please try again";
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

      {/* Header */}
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

      {/* Signup Form */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={styles.formContainer}
          entering={SlideInDown.delay(600).duration(800)}
        >
          <View style={styles.formCard}>
            <Text style={styles.welcomeTitle}>Create Account</Text>
            <Text style={styles.welcomeSubtitle}>
              Join us to start managing your business
            </Text>

            {/* Success Message */}
            {emailSent && (
              <Animated.View
                style={styles.successContainer}
                entering={FadeInUp.duration(300)}
              >
                <MaterialIcons name="check-circle" size={20} color="#10b981" />
                <Text style={styles.successText}>
                  Verification email sent! Please check your inbox before
                  logging in.
                </Text>
              </Animated.View>
            )}

            {/* Name Fields */}
            <View style={styles.nameRow}>
              <Animated.View
                style={[styles.inputGroup, styles.halfWidth]}
                entering={SlideInRight.delay(800).duration(600)}
              >
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="person" size={20} color="#6b7280" />
                  <TextInput
                    placeholder="Enter first name"
                    value={firstname}
                    onChangeText={handleInputChange(setFirstName)}
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </Animated.View>

              <Animated.View
                style={[styles.inputGroup, styles.halfWidth]}
                entering={SlideInRight.delay(900).duration(600)}
              >
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="person-outline"
                    size={20}
                    color="#6b7280"
                  />
                  <TextInput
                    placeholder="Enter last name"
                    value={lastname}
                    onChangeText={handleInputChange(setLastName)}
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </Animated.View>
            </View>

            {/* Email Input */}
            <Animated.View
              style={styles.inputGroup}
              entering={SlideInRight.delay(1000).duration(600)}
            >
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color="#6b7280" />
                <TextInput
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={handleInputChange(setEmail)}
                  keyboardType="email-address"
                  style={styles.input}
                  autoCapitalize="none"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </Animated.View>

            {/* Password Input */}
            <Animated.View
              style={styles.inputGroup}
              entering={SlideInRight.delay(1100).duration(600)}
            >
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color="#6b7280" />
                <TextInput
                  placeholder="Create a password"
                  value={password}
                  onChangeText={handleInputChange(setPassword)}
                  secureTextEntry={!passwordVisible}
                  style={styles.input}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={passwordVisible ? "eye-off" : "eye"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Confirm Password Input */}
            <Animated.View
              style={styles.inputGroup}
              entering={SlideInRight.delay(1200).duration(600)}
            >
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock-outline" size={20} color="#6b7280" />
                <TextInput
                  placeholder="Confirm your password"
                  value={reconfirmpassword}
                  onChangeText={handleInputChange(setReConfirmPassword)}
                  secureTextEntry={!repasswordVisible}
                  style={styles.input}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  onPress={() => setRePasswordVisible(!repasswordVisible)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={repasswordVisible ? "eye-off" : "eye"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Error Message */}
            {errorMessage && (
              <Animated.View
                style={styles.errorContainer}
                entering={FadeInUp.duration(300)}
              >
                <MaterialIcons name="error-outline" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </Animated.View>
            )}

            {/* Signup Button */}
            {!emailSent && (
              <Animated.View
                style={styles.buttonContainer}
                entering={BounceIn.delay(1400).duration(800)}
              >
                <TouchableOpacity
                  onPress={handleSignup}
                  style={[
                    styles.signupButton,
                    isLoading && styles.buttonDisabled,
                  ]}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.loadingText}>
                        Creating Account...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.signupButtonText}>
                        Create Account
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Login Link */}
            <Animated.View
              style={styles.loginLinkContainer}
              entering={FadeInUp.delay(1600).duration(600)}
            >
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push(`/login`)}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const { width, height } = Dimensions.get("window");

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

  // Header Section
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
    marginRight: 40,
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

  // Form Section
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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

  // Success Message
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  successText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },

  // Input Groups
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  halfWidth: {
    flex: 1,
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

  // Error Handling
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

  // Buttons
  buttonContainer: {
    marginBottom: 24,
  },
  signupButton: {
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
  signupButtonText: {
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

  // Login Link
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#6b7280",
    fontSize: 14,
  },
  loginLink: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: "700",
  },
});
