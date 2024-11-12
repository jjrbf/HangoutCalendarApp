import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

const db = getFirestore();

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [validUser, setUsernameValid] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState("");

  useEffect(() => {
    async function checkUsername(username) {
      const usernameRegex = /^[A-Za-z0-9_]{5,}$/;

      if (!usernameRegex.test(username)) {
        setUsernameValid(false);
        setUsernameMessage("Username must be at least 5 characters and contain only letters, numbers, or underscores.");
        return;
      }

      try {
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setUsernameValid(true);
          setUsernameMessage("Username is available!");
        } else {
          setUsernameValid(false);
          setUsernameMessage("Username is already taken. Please choose another.");
        }
      } catch (error) {
        console.error("Error checking username:", error);
        Alert.alert("Error", "Could not check username availability.");
      }
    }

    if (username) {
      checkUsername(username);
    } else {
      setUsernameValid(false);
      setUsernameMessage("");
    }
  }, [username]);

  const handleSignUp = async () => {
    if (!name || !email || !password || !username) {
      Alert.alert("Validation Error", "Please fill out all fields.");
      return;
    }

    if (!validUser) {
      Alert.alert("Validation Error", "Username is either taken or invalid.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      await setDoc(doc(db, "users", userId), {
        name: name,
        username: username,
        email: email,
        profilePicture: "",
        friends: [],
        sharedCalendars: [],
      });

      const calendarId = `personal_calendar_${userId}`;
      await setDoc(doc(db, "calendars", calendarId), {
        ownerId: userId,
        name: `${name}'s Personal Calendar`,
        members: [userId],
        createdAt: new Date(),
      });

      Alert.alert("Sign Up Success!", "Your account has been created.");
      navigation.navigate("SignIn");
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
      {usernameMessage ? (
        <Text style={{ color: validUser ? "green" : "red", marginBottom: 10 }}>
          {usernameMessage}
        </Text>
      ) : null}
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
    marginBottom: 10,
    paddingLeft: 10,
  },
});
