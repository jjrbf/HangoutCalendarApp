import React, { useState, useEffect } from "react";
import { Text, Button, Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Calendar from "expo-calendar";
import { Picker } from "@react-native-picker/picker";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen({ navigation }) {
  const userId = auth.currentUser.uid;
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState(null);

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

  useEffect(() => {
    const loadStoredCalendar = async () => {
      try {
        const storedCalendar = await AsyncStorage.getItem("@device_calendar_imported");
        if (storedCalendar) {
          const calendar = JSON.parse(storedCalendar);
          setSelectedCalendarId(calendar.id);
        }
      } catch (error) {
        console.error("Error loading stored calendar:", error);
      }
    };

    loadStoredCalendar();
  }, []);

  const handleSaveCalendar = async () => {
    try {
      const selectedCalendar = calendars.find((cal) => cal.id === selectedCalendarId);

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
        <Button title="Save" onPress={handleSaveCalendar} />
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
});
