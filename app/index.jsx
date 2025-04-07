import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import Animated, { SlideInRight } from "react-native-reanimated";

export default function index() {
  const router = useRouter();
  return (
    <Animated.View
      style={styles.container}
      entering={SlideInRight.duration(500)}
    >
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <Image source={require("../assets/Deer.jpg")} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={styles.titleB}>Welcome to Record Track!</Text>
        <Text style={styles.titleG}>
          Where you can keep your records secure and updated just on one click.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", backgroundColor: "black" },
  image: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    backgroundColor: "trasparent",
    padding: 20,
    width: "100%",
    height: 250,
    alignItems: "center",
    marginTop: 40,
  },
  titleB: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginTop: 25,
  },
  titleG: {
    fontSize: 20,
    textAlign: "center",
    paddingTop: 5,
    color: "rgba(221, 221, 221, 0.94)",
  },
  button: {
    backgroundColor: "black",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 8,
    shadowColor: "grey",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 400,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
