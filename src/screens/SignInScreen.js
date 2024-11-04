import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { auth } from '../firebaseConfig'; // Ensure this imports your auth instance
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Login Success!", "You are now logged in.");
      navigation.navigate("ProtectedLayout");
    } catch (error) {
      console.error("Sign In Error:", error);
      Alert.alert("Sign In Failed", error.message);
    }
  };

  return (
    <View style={styles.signInContainer}>
      <Text>Sign In</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign In" onPress={handleSignIn} />
      <Button
        title="Don't have an account? Sign Up"
        onPress={() => navigation.navigate("SignUp")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  signInContainer: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    paddingLeft: 10,
    paddingRight: 10,
  },
});
