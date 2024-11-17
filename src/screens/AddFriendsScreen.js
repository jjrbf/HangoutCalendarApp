import React, { useEffect, useState } from "react";
import { Text, Button, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../firebaseConfig"; // Import Firestore db
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions

export default function AddFriendsScreen({ navigation }) {
  const [userName, setUserName] = useState("");
  const userId = auth.currentUser.uid; // Get the currently authenticated user's ID

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId)); // Fetch user document
        if (userDoc.exists()) {
          setUserName(userDoc.data().name); // Set user's name
        } else {
          console.error("No such user document!");
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };

    fetchUserData();
  }, [userId]); // Fetch user data when userId changes

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
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.userName}>{userName}</Text>
      <Button title="Logout" onPress={handleLogout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    marginBottom: 20,
  },
});
