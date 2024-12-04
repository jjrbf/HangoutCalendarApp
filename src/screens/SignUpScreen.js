import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

const db = getFirestore();

// Component for handling signing up new users
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
      // navigation.navigate("SignIn");
    } catch (error) {
      console.error("Sign Up Error:", error);
      Alert.alert("Sign Up Failed", error.message);
    }
  };

  return (
    <View style={styles.signUpContainer}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        placeholderTextColor="#888"
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
    marginBottom: 10,
    paddingLeft: 10,
    borderColor: "#ccc",
    borderRadius: 10,
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
