import React, { useState, useCallback } from "react";
import {
  Text,
  Alert,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { auth, db } from "../../firebaseConfig";
import { ProfilePicture } from "../../components";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { doc, getDoc } from "firebase/firestore";

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const userId = auth.currentUser.uid;

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setName(userData.name || "Unknown");
        setUsername(userData.username || "unknown");
      } else {
        console.error("No such user document!");
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [userId])
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
        <TouchableOpacity
          style={styles.hamburgerIcon}
          onPress={() => navigation.navigate("Settings")}
        >
          <MaterialCommunityIcons name="menu" size={30} color="black" />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <ProfilePicture userId={userId} size={100} />
        <View style={styles.profileContainer}>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userNickname}>@{username}</Text>
          {/* Edit Profile Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Text style={styles.editProfileLink}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Friends Button */}
      <TouchableOpacity
        style={styles.friendsButton}
        onPress={() => navigation.navigate("AddFriends")}
      >
        <Text style={styles.friendsText}>Friends</Text>
        <MaterialCommunityIcons name="chevron-right" size={28} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  hamburgerIcon: {
    padding: 2,
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileContainer: {
    alignItems: "center",
  },
  userName: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: "bold",
  },
  userNickname: {
    fontSize: 16,
    color: "#555",
  },
  editProfileLink: {
    color: "#007BFF", // Blue text, matching button color
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12, // Slight space beneath username
  },
  friendsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e6e6e6",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  friendsText: {
    color: "#222",
    fontSize: 20,
    fontWeight: "600",
  },
});
