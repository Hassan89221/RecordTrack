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
import { getAuth } from "firebase/auth";
import { db } from "../../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { AntDesign, FontAwesome } from "@expo/vector-icons";

export default function header() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(200)).current; // Initially off-screen

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
      Animated.timing(slideAnim, {
        toValue: 200,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <View style={styles.header}>
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <TouchableOpacity onPress={() => router.back()}>
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Record-Track</Text>
      <View>
        <TouchableOpacity style={styles.userInfo} onPress={toggleMenu}>
          <Text style={styles.userText}>Hi, {userName}</Text>
          <FontAwesome name="bars" size={20} color="white" />
        </TouchableOpacity>

        {/* Sliding Menu */}
        {menuVisible && (
          <Animated.View
            style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/changepassword")}
            >
              <Text style={styles.menuText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "black",
    elevation: 3,
    position: "relative",
    zIndex: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "black",
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  userText: {
    color: "white",
    fontWeight: "bold",
    marginRight: 5,
  },
  menu: {
    position: "absolute",
    top: 50,
    right: 0,
    width: 180,
    backgroundColor: "#222",
    borderRadius: 8,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    zIndex: 100,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  menuText: {
    color: "white",
    fontSize: 16,
    fontWeight: "300",
    textAlign: "center",
  },
  logoutText: {
    color: "red",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
