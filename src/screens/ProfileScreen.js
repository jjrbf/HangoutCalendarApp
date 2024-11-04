import React from "react";
import { Text, Button, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";

export default function ProfileScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logged Out", "You have been logged out successfully.");
      navigation.navigate("SignIn"); // Navigate back to the SignIn screen
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Logout Failed", error.message);
    }
  };

  return (
    <SafeAreaView>
      <Text>My Profile</Text>

      <Button title="Logout" onPress={handleLogout} />
    </SafeAreaView>
  );
}
