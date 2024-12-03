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
import { signOut } from "firebase/auth";
import * as Calendar from "expo-calendar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function SettingsScreen({ navigation }) {
  const userId = auth.currentUser.uid;
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
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
  }, []);

  useEffect(() => {
    // Set navigation header
    navigation.setOptions({
      headerTitle: "Settings",
      headerTitleStyle: { fontSize: 24, fontWeight: "bold" },
      headerTitleAlign: "center",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
      ),
    });

    // Check if calendar access permission has already been granted
    (async () => {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      if (status === "granted") {
        setHasPermission(true);
        fetchCalendars();
      }
    })();
  }, [navigation]);

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

      setHasPermission(true); // Update state to show picker and save button
      const allCalendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );
      setCalendars(allCalendars);
    } catch (error) {
      console.error("Error fetching calendars:", error);
      Alert.alert("Error", "An error occurred while fetching calendars.");
    }
  }

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
      // navigation.navigate("SignIn");
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Logout Failed", error.message);
    }
  };

  const handleRemoveCalendar = async () => {
    try {
      // Remove calendar from AsyncStorage
      await AsyncStorage.removeItem("@device_calendar_imported");

      // Delete busyTimes from Firestore
      const busyTimesCollection = collection(db, "users", userId, "busyTimes");
      const busyTimesSnapshot = await getDocs(busyTimesCollection);

      const deletePromises = busyTimesSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      Alert.alert("Success", "Calendar and associated busy times removed.");
      setSelectedCalendarId(null); // Reset selected calendar
    } catch (error) {
      console.error("Error removing calendar and busy times:", error);
      Alert.alert("Error", "Failed to remove calendar and busy times.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profilePictureContainer}>
        <Text style={styles.header}>Update Profile Picture</Text>
        {profilePicture ? (
          <Image source={{ uri: profilePicture }} style={styles.profileImage} />
        ) : (
          <Image
            source={require("../../../assets/profile-picture-default.png")}
            style={styles.profileImage}
          />
        )}

        {/* Upload Profile Picture */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleUploadProfilePicture}
        >
          <Text style={styles.secondaryButtonText}>Upload Profile Picture</Text>
        </TouchableOpacity>

        {/* Delete Profile Picture */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            !profilePicture && styles.deleteButtonDisabled,
          ]}
          onPress={handleDeleteProfilePicture}
          disabled={!profilePicture}
        >
          <Text style={[
            styles.deleteButtonText,
            !profilePicture && styles.deleteButtonDisabledText,
          ]}>Delete Profile Picture</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.header}>Add Calendar From Device</Text>

      {!hasPermission ? (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={fetchCalendars}
        >
          <Text style={styles.secondaryButtonText}>Import Calendars</Text>
        </TouchableOpacity>
      ) : (
        <>
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
          </View>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSaveCalendar}
          >
            <Text style={styles.secondaryButtonText}>Save Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleRemoveCalendar}
          >
            <Text style={styles.deleteButtonText}>Remove Calendar</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
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
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  pickerContainer: {
    width: "100%",
    alignItems: "center",
    // marginBottom: 150,
  },
  calendarPicker: {
    width: "100%",
    height: 60,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: "#dfe7fd",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: "#ffeaea",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  deleteButtonDisabled: {
    backgroundColor: "#c4c4c4",
  },
  deleteButtonDisabledText: {
    color: "#565656",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButtonText: {
    color: "#8c0b0b",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  profilePictureContainer: {
    marginBottom: 40,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20, // Space between profile image and buttons
    alignSelf: "center",
  },
  logoutButton: {
    backgroundColor: "#ffeaea",
    padding: 10,
    borderRadius: 18,
    alignItems: "center",
    alignSelf: "center", // Centers the button
    marginTop: "auto", // Pushes the button to the bottom
    marginBottom: 12,
    width: 120, // Restricts the button width
  },
  logoutButtonText: {
    color: "red", // Red text
    fontSize: 18,
    fontWeight: "bold",
  },
});
