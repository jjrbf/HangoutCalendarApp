import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function ProfilePicture({ userId, size }) {
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
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
          style={{ width: size, height: size, borderRadius: size/2 }}
        />
      ) : (
        <Image
          source={require("../../assets/profile-picture-default.png")} // Fallback image
          style={{ width: size, height: size, borderRadius: size/2 }}
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
