import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import Animated, {
  SlideInRight,
  FadeInUp,
  SlideInDown,
  BounceIn,
  SlideInLeft,
} from "react-native-reanimated";
import { auth } from "../firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

export default function index() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, [initializing]);

  const handleGetStarted = () => {
    setIsCheckingAuth(true);

    // Wait a moment for Firebase to finish initializing if needed
    setTimeout(
      () => {
        const currentUser = auth.currentUser;
        console.log("Current user state:", currentUser);

        setIsCheckingAuth(false);

        if (currentUser && currentUser.emailVerified) {
          console.log("User is authenticated, going to shops");
          router.push("/shops");
        } else {
          console.log("User not authenticated, going to login");
          router.push("/login");
        }
      },
      initializing ? 1500 : 100
    ); // Wait longer if still initializing
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4f46e5" barStyle="light-content" />

      {/* Background Image with Overlay */}
      <Image
        source={require("../assets/Deer.jpg")}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay} />

      {/* Header Section */}
      <Animated.View
        style={styles.headerSection}
        entering={FadeInUp.duration(800)}
      >
        <View style={styles.logoContainer}>
          <Animated.View
            style={styles.logoIcon}
            entering={BounceIn.delay(400).duration(1000)}
          >
            <MaterialIcons name="analytics" size={40} color="white" />
          </Animated.View>
          <Animated.Text
            style={styles.logoText}
            entering={SlideInRight.delay(600).duration(800)}
          >
            RecordTrack
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Content Section */}
      <Animated.View
        style={styles.contentSection}
        entering={SlideInDown.delay(800).duration(800)}
      >
        <Text style={styles.mainTitle}>Welcome to the Future</Text>
        <Text style={styles.subtitle}>
          Keep your business records secure, organized, and accessible with just
          one click
        </Text>

        <View style={styles.featuresContainer}>
          <Animated.View
            style={styles.featureItem}
            entering={SlideInLeft.delay(1200).duration(600)}
          >
            <Ionicons name="shield-checkmark" size={24} color="#4f46e5" />
            <Text style={styles.featureText}>Secure Storage</Text>
          </Animated.View>

          <Animated.View
            style={styles.featureItem}
            entering={SlideInLeft.delay(1400).duration(600)}
          >
            <Ionicons name="flash" size={24} color="#4f46e5" />
            <Text style={styles.featureText}>Real-time Updates</Text>
          </Animated.View>

          <Animated.View
            style={styles.featureItem}
            entering={SlideInLeft.delay(1600).duration(600)}
          >
            <Ionicons name="trending-up" size={24} color="#4f46e5" />
            <Text style={styles.featureText}>Business Analytics</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Button Section */}
      <Animated.View
        style={styles.buttonContainer}
        entering={BounceIn.delay(1800).duration(800)}
      >
        <TouchableOpacity
          style={[
            styles.getStartedButton,
            isCheckingAuth && styles.buttonDisabled,
          ]}
          onPress={handleGetStarted}
          disabled={isCheckingAuth}
          activeOpacity={0.8}
        >
          {isCheckingAuth ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingDot} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </View>
          )}
        </TouchableOpacity>
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
    backgroundColor: "rgba(79, 70, 229, 0.85)", // Purple overlay to match theme
  },

  // Header Section
  headerSection: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    letterSpacing: 1,
  },

  // Content Section
  contentSection: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -100,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 40,
    paddingHorizontal: 10,
  },

  // Features Section
  featuresContainer: {
    width: "100%",
    marginTop: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 16,
  },

  // Button Section
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  getStartedButton: {
    backgroundColor: "#1f2937",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#000",
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
  buttonText: {
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
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
    marginRight: 8,
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});
