import React, { useState, useEffect } from "react";
import { Text, Button, Alert, StyleSheet, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Calendar from "expo-calendar";
import { Picker } from "@react-native-picker/picker";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { db } from "../../firebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen({ navigation }) {
  const userId = auth.currentUser.uid;
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null); // For storing the profile picture URL

  async function fetchCalendars() {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "You need to allow access to your calendar."
        );
        return;
      }

      const allCalendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );
      setCalendars(allCalendars);
    } catch (error) {
      console.error("Error fetching calendars:", error);
      Alert.alert("Error", "An error occurred while fetching calendars.");
    }
  }

  // Fetch user profile picture from Firestore
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
  }, []);

  const handleUploadProfilePicture = async () => {
    // Ask for permission to access the gallery
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

        // Update the profile picture URL in Firestore
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { profilePicture: downloadURL });

        setProfilePicture(downloadURL); // Update local state for immediate UI update
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
      await deleteObject(storageRef); // Delete the image from Firebase Storage

      // Remove the profile picture URL from Firestore
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, { profilePicture: null });

      setProfilePicture(null); // Update local state for immediate UI update
      Alert.alert("Success", "Profile picture deleted successfully.");
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      Alert.alert("Error", "Could not delete profile picture.");
    }
  };

  const handleSaveCalendar = async () => {
    try {
      const selectedCalendar = calendars.find(
        (cal) => cal.id === selectedCalendarId
      );

      if (!selectedCalendar) {
        Alert.alert("Error", "Please select a valid calendar.");
        return;
      }

      await AsyncStorage.setItem(
        "@device_calendar_imported",
        JSON.stringify(selectedCalendar)
      );
      Alert.alert("Success", "Calendar saved successfully!");
    } catch (error) {
      console.error("Error saving calendar:", error);
      Alert.alert("Error", "Failed to save calendar.");
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Profile Picture Section */}
      <Text style={styles.header}>Profile Picture:</Text>
      {profilePicture ? (
        <Image source={{ uri: profilePicture }} style={styles.profileImage} />
      ) : (
        <Image
          source={require("../../../assets/profile-picture-default.png")} // Default image
          style={styles.profileImage}
        />
      )}
      <Button
        title="Upload Profile Picture"
        onPress={handleUploadProfilePicture}
      />
      <Button
        title="Delete Profile Picture"
        onPress={handleDeleteProfilePicture}
        disabled={!profilePicture}
      />

      <Text style={styles.header}>Import a Calendar:</Text>
      <Button title="Import Calendars" onPress={fetchCalendars} />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCalendarId}
          onValueChange={(itemValue) => setSelectedCalendarId(itemValue)}
          style={styles.calendarPicker}
        >
          <Picker.Item label="Select a Calendar" value={null} />
          {calendars.map((calendar) => (
            <Picker.Item
              key={calendar.id}
              label={calendar.title}
              value={calendar.id}
            />
          ))}
        </Picker>
        <Button title="Save Calendar" onPress={handleSaveCalendar} />
      </View>
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
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  header: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  pickerContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarPicker: {
    width: "90%",
    height: 100,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
});
