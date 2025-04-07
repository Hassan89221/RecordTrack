import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from "react-native";
import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase.config";
import {
  GestureHandlerRootView,
  TextInput,
} from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { db } from "../firebase.config";
import { doc, setDoc } from "firebase/firestore";

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

  const handleInputChange = (setter) => (value) => {
    setter(value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  const handleSignup = () => {
    if (!email.includes("@") || !email.includes(".")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (password !== reconfirmpassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        sendEmailVerification(user)
          .then(() => {
            alert("Verification Email Sent! Please check your mail box");
          })
          .catch((error) => {
            setErrorMessage("Error sending verification email");
          });

        // **Save user details in Firestore**
        try {
          await setDoc(doc(db, "users", user.uid), {
            firstName: firstname,
            lastName: lastname,
            email: email,
            createdAt: new Date(),
          });
          console.log("User saved to Firestore");
        } catch (error) {
          console.error("Error saving user:", error);
        }

        // Clear input fields
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setReConfirmPassword("");
      })
      .catch((error) => {
        const errorMsg = error.message;
        setErrorMessage(errorMsg);
      });
  };
  return (
    <GestureHandlerRootView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <Image source={require("../assets/Deer.jpg")} style={styles.image} />
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Signup</Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="FirstName"
            value={firstname}
            onChangeText={handleInputChange(setFirstName)}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="LastName"
            value={lastname}
            onChangeText={handleInputChange(setLastName)}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={handleInputChange(setEmail)}
            keyboardType="email-address"
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={handleInputChange(setPassword)}
            secureTextEntry={!passwordVisible}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.eyeButton}
          >
            <Text>{passwordVisible ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Re-Confirm Password"
            value={reconfirmpassword}
            onChangeText={handleInputChange(setReConfirmPassword)}
            secureTextEntry={!repasswordVisible}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={() => setRePasswordVisible(!repasswordVisible)}
            style={styles.eyeButton}
          >
            <Text>{repasswordVisible ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {!emailSent && (
          <TouchableOpacity onPress={handleSignup} style={styles.signupButton}>
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>
        )}
        {emailSent && (
          <Text style={styles.sentEmail}>
            A verification Email has been sent. Please verify before login.
          </Text>
        )}
        <View style={styles.loginContainer}>
          <Text style={styles.text}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push(`/login`)}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: { width: "80%", alignItems: "center" },
  image: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  inputContainer: { width: "100%", marginBottom: 16 },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    color: "#111827",
    borderRadius: 6,
  },
  errorText: { color: "#ef4444", marginBottom: 16, textAlign: "center" },
  signupButton: {
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
  signupButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  loginContainer: { marginTop: 16, flexDirection: "row" },
  text: { color: "gray" },
  loginText: { color: "white", fontWeight: "600" },
  sentEmail: { color: "green", marginTop: 4, textAlign: "center" },
  eyeButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
});
