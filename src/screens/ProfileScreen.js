import React, { useEffect, useState } from "react";
import {
  Text,
  Button,
  Alert,
  StyleSheet,
  FlatList,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [friends, setFriends] = useState([]);
  const userId = auth.currentUser.uid;

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setName(userData.name);
          setUsername(userData.username);

          // Fetch friends details
          const friendUids = userData.friends || [];
          const friendPromises = friendUids.map((friendUid) =>
            getDoc(doc(db, "users", friendUid))
          );
          const friendDocs = await Promise.all(friendPromises);

          const friendList = friendDocs
            .filter((doc) => doc.exists())
            .map((doc) => ({
              id: doc.id,
              name: doc.data().name,
              username: doc.data().username,
            }));

          setFriends(friendList);
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
      navigation.navigate("SignIn");
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Logout Failed", error.message);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    Alert.alert(
      "Remove Friend",
      "Are you sure you want to remove this friend?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "users", userId), {
                friends: arrayRemove(friendId),
              });
              setFriends((prevFriends) =>
                prevFriends.filter((friend) => friend.id !== friendId)
              );
              Alert.alert("Success", "Friend removed successfully.");
            } catch (error) {
              console.error("Error removing friend:", error);
              Alert.alert("Error", "Could not remove friend.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.userName}>{name}</Text>
      <Text style={styles.userName}>@{username}</Text>

      <Text style={styles.subTitle}>Friends:</Text>
      {friends.length > 0 ? (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.friendItem}>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.name}</Text>
                <Text style={styles.friendUsername}>@{item.username}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFriend(item.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noFriendsText}>No friends added yet.</Text>
      )}

      <Button
        title="Add Friends"
        onPress={() => navigation.navigate("FriendsScreen")}
      />
      <Button title="Logout" onPress={handleLogout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: "center",
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
  subTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    width: "100%",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  friendUsername: {
    fontSize: 14,
    color: "#555",
  },
  removeButton: {
    backgroundColor: "red",
    padding: 8,
    borderRadius: 5,
  },
  removeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  noFriendsText: {
    marginVertical: 10,
    fontSize: 16,
    color: "#555",
  },
});
