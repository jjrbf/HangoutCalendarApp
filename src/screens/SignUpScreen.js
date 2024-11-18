import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const db = getFirestore(); // Initialize Firestore

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    // Field validation
    if (!name || !email || !password) {
      Alert.alert("Validation Error", "Please fill out all fields.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Get the user's UID
      const userId = userCredential.user.uid;

      // Create user document in the 'users' collection
      await setDoc(doc(db, "users", userId), {
        name: name,
        email: email,
        profilePicture: "", // or a default picture URL
        friends: [],
        sharedCalendars: [],
      });

      // Create a personal calendar for the user in the 'calendars' collection
      const calendarId = `personal_calendar_${userId}`; // Unique calendar ID for the user's personal calendar
      await setDoc(doc(db, "calendars", calendarId), {
        ownerId: userId,
        name: `${name}'s Personal Calendar`,
        members: [userId], // Include the user as a member
        createdAt: new Date(), // or use Firebase Timestamp
      });

      Alert.alert("Sign Up Success!", "Your account has been created.");
      navigation.navigate("SignIn"); // Redirect to sign-in screen after successful sign-up
    } catch (error) {
      console.error("Sign Up Error:", error);
      Alert.alert("Sign Up Failed", error.message);
    }
  };

  return (
    <View style={styles.signUpContainer}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#888"
      />
      <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
        <Text style={styles.signUpButtonText}>Sign Up</Text>
      </TouchableOpacity>
      <View style={styles.signInContainer}>
        <Text style={styles.signInText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
          <Text style={styles.highlightedSignInText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  signUpContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  signUpButton: {
    width: "100%",
    padding: 15,
    backgroundColor: "#007BFF",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  signInContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  signInText: {
    fontSize: 14,
    color: "#888",
  },
  highlightedSignInText: {
    fontSize: 14,
    color: "#007BFF",
    fontWeight: "bold",
    marginLeft: 5,
    textDecorationLine: "underline",
  },
});
