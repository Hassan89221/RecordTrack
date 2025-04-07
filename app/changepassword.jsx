import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { AntDesign } from "@expo/vector-icons";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentpasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [reConfirmPasswordVisible, setReconfirmPasswordVisible] =
    useState(false);
  const router = useRouter();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "User not found. Please log in again.");
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
      Alert.alert("Success", "Password updated successfully!");
      router.push("/"); // Redirect to home screen
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
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
        <View style={styles.inputContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push("/shops")}>
              <AntDesign name="arrowleft" size={30} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Change Password</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry={!currentpasswordVisible}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setCurrentPasswordVisible(!currentpasswordVisible)}
              style={styles.eyeButton}
            >
              <Text>{currentpasswordVisible ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          {/* "Don't Remember Password?" Link */}
          <TouchableOpacity onPress={() => router.push("/forgetpassword")}>
            <Text style={styles.forgotText}>Don't remember password?</Text>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry={!newPasswordVisible}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setNewPasswordVisible(!newPasswordVisible)}
              style={styles.eyeButton}
            >
              <Text>{newPasswordVisible ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry={!reConfirmPasswordVisible}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() =>
                setReconfirmPasswordVisible(!reConfirmPasswordVisible)
              }
              style={styles.eyeButton}
            >
              <Text>{reConfirmPasswordVisible ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
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
  eyeButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  forgotText: {
    color: "white",
    textAlign: "left",
    marginBottom: 15,
    fontSize: 15,
    fontWeight: "bold",
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
});
