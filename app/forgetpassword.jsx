import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { TextInput } from "react-native-paper";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase.config";
import { getDoc, doc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { StatusBar } from "react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      setMessage("Please enter your email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link sent to your email");
    } catch (error) {
      setMessage("Error sending reset email. Try again later");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <Image source={require("../assets/Deer.jpg")} style={styles.image} />
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Forgot Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>
        {message && <Text style={styles.message}>{message}</Text>}
        <TouchableOpacity onPress={handleResetPassword} style={styles.button}>
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.backToLogin}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  image: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  innerContainer: { width: "80%", alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  inputContainer: { width: "100%", marginBottom: 16 },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d5db",
    color: "#111827",
    borderRadius: 6,
  },
  message: {
    color: "green",
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "black",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 8,
    shadowColor: "grey",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  backToLogin: {
    marginTop: 16,
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
});
