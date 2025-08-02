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
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase.config";
import Animated, {
  SlideInDown,
  FadeInUp,
  SlideInRight,
  BounceIn,
} from "react-native-reanimated";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

export default function login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      const savedEmail = await AsyncStorage.getItem("email");
      const savedPassword = await AsyncStorage.getItem("password");
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
    };
    loadCredentials();
  }, []);

  const handleInputChange = (setter) => (value) => {
    setter(value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (user.emailVerified) {
        // Store credentials
        await AsyncStorage.setItem("email", email);
        await AsyncStorage.setItem("password", password);
        await AsyncStorage.setItem("userId", user.uid);

        // Fetch user data
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          await AsyncStorage.setItem("userData", JSON.stringify(userData));
        }

        router.push("/shops");
      } else {
        setErrorMessage("Please verify your email before logging in");
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "No account found with this email";
      case "auth/wrong-password":
        return "Incorrect password";
      case "auth/invalid-email":
        return "Please enter a valid email address";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later";
      default:
        return "Login failed. Please check your credentials";
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

      {/* Login Form */}
      <Animated.View
        style={styles.formContainer}
        entering={SlideInDown.delay(600).duration(800)}
      >
        <View style={styles.formCard}>
          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to your account</Text>

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
            entering={SlideInRight.delay(1000).duration(600)}
          >
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6b7280" />
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={handleInputChange(setPassword)}
                secureTextEntry={!passwordVisible}
                style={styles.input}
                autoCapitalize="none"
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

          {/* Forgot Password */}
          <Animated.View
            style={styles.forgotContainer}
            entering={FadeInUp.delay(1200).duration(600)}
          >
            <TouchableOpacity onPress={() => router.push(`/forgetpassword`)}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Login Button */}
          <Animated.View
            style={styles.buttonContainer}
            entering={BounceIn.delay(1400).duration(800)}
          >
            <TouchableOpacity
              onPress={handleLogin}
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.loadingText}>Signing In...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Sign Up Link */}
          <Animated.View
            style={styles.signupLinkContainer}
            entering={FadeInUp.delay(1600).duration(600)}
          >
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push(`/signup`)}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
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

  // Form Section
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

  // Input Groups
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

  // Sign Up Link
  signupLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    color: "#6b7280",
    fontSize: 14,
  },
  signupLink: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: "700",
  },
});
