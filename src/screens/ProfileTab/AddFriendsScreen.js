import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  FlatList,
  StyleSheet,
} from "react-native";
import { db, auth } from "../../firebaseConfig";
import {
  getDocs,
  query,
  collection,
  where,
  updateDoc,
  arrayUnion,
  doc,
} from "firebase/firestore";

export default function FriendsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", searchQuery));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("No Results", "No user found with that username.");
        setSearchResults([]);
      } else {
        const results = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Search Error:", error);
      Alert.alert("Error", "Could not search for users.");
    }
  };

  const handleAddFriend = async (friendId) => {
    const userId = auth.currentUser.uid;
    try {
      await updateDoc(doc(db, "users", userId), {
        friends: arrayUnion(friendId),
      });
      Alert.alert("Success", "Friend added successfully!");
    } catch (error) {
      console.error("Add Friend Error:", error);
      Alert.alert("Error", "Could not add friend.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Friends</Text>
      <TextInput
        placeholder="Search by username"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.input}
      />
      <Button title="Search" onPress={handleSearch} />
      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.resultItem}>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultUsername}>@{item.username}</Text>
              <Button
                title="Add Friend"
                onPress={() => handleAddFriend(item.id)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  resultName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  resultUsername: {
    fontSize: 14,
    color: "#555",
  },
});
