import React, { useState, useEffect } from "react";
import { Text, Alert, StyleSheet, View, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db } from "../../firebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth } from "../../firebaseConfig";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

 // This is for future implementation, kinda useless atm because we put the profile picture changing to the settings
export default function EditProfileScreen({ navigation }) {
  const userId = auth.currentUser.uid;
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

    // Set navigation header
    navigation.setOptions({
      headerTitle: "Edit Profile",
      headerTitleStyle: { fontSize: 24, fontWeight: "bold" },
      headerTitleAlign: "center",
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, []);

  const handleUploadProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Permission to access gallery was denied"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      const storage = getStorage();
      const storageRef = ref(storage, `profile_pictures/${userId}.jpg`);
      const response = await fetch(imageUri);
      const blob = await response.blob();

      try {
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { profilePicture: downloadURL });

        setProfilePicture(downloadURL);
        Alert.alert("Success", "Profile picture uploaded successfully!");
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        Alert.alert("Error", "Could not upload profile picture.");
      }
    }
  };

  const handleDeleteProfilePicture = async () => {
    const storage = getStorage();
    const storageRef = ref(storage, `profile_pictures/${userId}.jpg`);

    try {
      await deleteObject(storageRef);

      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, { profilePicture: null });

      setProfilePicture(null);
      Alert.alert("Success", "Profile picture deleted successfully.");
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      Alert.alert("Error", "Could not delete profile picture.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Picture */}
      {profilePicture ? (
        <Image source={{ uri: profilePicture }} style={styles.profileImage} />
      ) : (
        <Image
          source={require("../../../assets/profile-picture-default.png")}
          style={styles.profileImage}
        />
      )}

      {/* Upload Profile Picture */}
      <TouchableOpacity style={styles.uploadButton} onPress={handleUploadProfilePicture}>
        <Text style={styles.uploadButtonText}>Upload Profile Picture</Text>
      </TouchableOpacity>

      {/* Delete Profile Picture */}
      <TouchableOpacity
        style={[styles.deleteButton, !profilePicture && styles.deleteButtonDisabled]}
        onPress={handleDeleteProfilePicture}
        disabled={!profilePicture}
      >
        <Text style={styles.deleteButtonText}>Delete Profile Picture</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  backButton: {
    marginLeft: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20, // Space between profile image and buttons
    marginTop: 40, // Adjustable top margin
    alignSelf: "center",
  },
  uploadButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8, // Space between Upload and Delete buttons
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#FF4444",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  deleteButtonDisabled: {
    backgroundColor: "#ddd",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
