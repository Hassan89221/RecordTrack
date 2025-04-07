import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  GestureHandlerRootView,
  TextInput,
} from "react-native-gesture-handler";
import { auth } from "../firebase.config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase.config";

export default function login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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
    setErrorMessage(null);
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        //alert('User Registered Successfully!')
        if (user.emailVerified) {
          alert("Login Successfully!");

          // Store new email and password
          await AsyncStorage.setItem("email", email);
          await AsyncStorage.setItem("password", password);
          // Store only user UID, not credentials
          await AsyncStorage.setItem("userId", user.uid);

          // Fetch user-specific data from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User Data:", userData); // Debugging

            // Store user data locally (optional)
            await AsyncStorage.setItem("userData", JSON.stringify(userData));
          }
          router.push("/shops");
        } else {
          setErrorMessage("Please Verify your email before login");
        }

        setEmail("");
        setPassword("");
      })
      .catch((error) => {
        const errorMsg = error.message;
        setErrorMessage(errorMsg);
      });
  };
  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <Image source={require("../assets/Deer.jpg")} style={styles.image} />
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Login</Text>

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
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.eyeButton}
          >
            <Text>{passwordVisible ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity onPress={() => router.push(`/forgetpassword`)}>
          <Text style={styles.forgettext}>Forget Password? </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogin} style={styles.signupButton}>
          <Text style={styles.signupButtonText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.text}>Don't have Account? </Text>
          <TouchableOpacity onPress={() => router.push(`/signup`)}>
            <Text style={styles.loginText}>SignUp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
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
  forgettext: {
    color: "white",
    fontWeight: "bold",
    paddingRight: 175,
  },
});
