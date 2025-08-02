import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import {
  AntDesign,
  FontAwesome,
  MaterialIcons,
  Ionicons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function header() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current; // Start further off-screen
  const fadeAnim = useRef(new Animated.Value(0)).current; // For fade animation
  const scaleAnim = useRef(new Animated.Value(1)).current; // For button press animation

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        console.log("User Info:", user); // Check if user is logged in

        if (!user) {
          console.log("No user logged in.");
          return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          console.log("User Data:", userDoc.data()); // Log fetched data
          setUserName(userDoc.data().firstName);
        } else {
          console.log("User document not found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };

    fetchUserName();
  }, []);
  const toggleMenu = () => {
    if (menuVisible) {
      // Closing animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setMenuVisible(false));
    } else {
      // Opening animation
      setMenuVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);

      // Clear stored credentials
      await AsyncStorage.removeItem("email");
      await AsyncStorage.removeItem("password");
      await AsyncStorage.removeItem("userId");
      await AsyncStorage.removeItem("userData");

      // Navigate to welcome screen
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error logging out. Please try again.");
    }
  };

  return (
    <View style={styles.headerContainer}>
      <StatusBar backgroundColor="#4f46e5" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>RecordTrack</Text>
          <Text style={styles.subtitle}>Business Manager</Text>
        </View>

        <View style={styles.userSection}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={styles.userInfo}
              onPress={() => {
                animateButtonPress();
                toggleMenu();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.userInitial}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userTextContainer}>
                <Text style={styles.userGreeting}>Hi there!</Text>
                <Text style={styles.userName}>{userName}</Text>
              </View>
              <Ionicons
                name={menuVisible ? "chevron-up" : "chevron-down"}
                size={20}
                color="white"
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Enhanced Sliding Menu */}
          {menuVisible && (
            <Animated.View
              style={[
                styles.menu,
                {
                  transform: [{ translateX: slideAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Account</Text>
              </View>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  toggleMenu();
                  router.push("/changepassword");
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="lock-outline" size={20} color="#6b7280" />
                <Text style={styles.menuText}>Change Password</Text>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={[styles.menuItem, styles.logoutItem]}
                onPress={() => {
                  toggleMenu();
                  handleLogout();
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={20} color="#ef4444" />
                <Text style={styles.logoutText}>Logout</Text>
                <Ionicons name="chevron-forward" size={16} color="#ef4444" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#4f46e5",
    elevation: 8,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
    position: "relative",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    zIndex: 9999,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginTop: 2,
  },
  userSection: {
    position: "relative",
    zIndex: 10000,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 25,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  userInitial: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  userTextContainer: {
    marginRight: 8,
  },
  userGreeting: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontWeight: "500",
  },
  userName: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  menu: {
    position: "absolute",
    top: 55,
    right: 0,
    width: 220,
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 999,
    zIndex: 10001,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  logoutItem: {
    marginTop: 4,
  },
  menuText: {
    flex: 1,
    color: "#374151",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 12,
  },
  logoutText: {
    flex: 1,
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 4,
    marginHorizontal: 16,
  },
});
