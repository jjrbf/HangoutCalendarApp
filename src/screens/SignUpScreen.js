import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const db = getFirestore();

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [validUser, setUsernameValid] = useState(false)

  useEffect(() => {
    async function checkUsername(username) {
      // code here to determine if the username is valid, make it more than 4 letters and be unique in the database
      // allow only letters, numbers, and underscores
      // set validUser to true if valid, set it to false if not
    }
    checkUsername(username);
  }, [username]);

  const handleSignUp = async () => {
    // Field validation
    if (!name || !email || !password || !username) {
      Alert.alert("Validation Error", "Please fill out all fields.");
      return;
    }
    
    if (!validUser) {
      Alert.alert("Username taken. Choose a new username.");
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
        username: username,
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
    <View style={styles.signInContainer}>
      <Text>Sign Up</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Sign Up" onPress={handleSignUp} />
      <Button
        title="Already have an account? Sign In"
        onPress={() => navigation.navigate("SignIn")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  signInContainer: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 10,
    paddingRight: 10,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
  },
});
