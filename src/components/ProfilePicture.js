import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Component to display a user's profile picture
// Props:
// - userId: ID of the user whose profile picture should be fetched
// - size: Size (width and height) of the profile picture to be displayed
export default function ProfilePicture({ userId, size }) {
  // State to store the profile picture URL fetched from Firestore
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    // Function to fetch the user's profile picture from Firestore
    const fetchProfilePicture = async () => {
      try {
        const userDocRef = doc(db, "users", userId);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          setProfilePicture(userSnapshot.data().profilePicture);
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePicture();
  }, [userId]);

  return (
    <View style={styles.container}>
      {profilePicture ? (
        <Image
          source={{ uri: profilePicture }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Image
          source={require("../../assets/profile-picture-default.png")} // Default placeholder image
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
