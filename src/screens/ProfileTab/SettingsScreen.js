import React, { useState, useEffect } from "react";
import { Text, Alert, StyleSheet, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Calendar from "expo-calendar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function SettingsScreen({ navigation }) {
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState(null);

  useEffect(() => {
    // Set navigation header
    navigation.setOptions({
      headerTitle: "Settings",
      headerTitleStyle: { fontSize: 24, fontWeight: "bold" },
      headerTitleAlign: "center",
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Import Calendar Section */}
      <Text style={styles.header}>Import Calendar</Text>
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
      <TouchableOpacity style={styles.fetchCalendarsButton} onPress={fetchCalendars}>
        <Text style={styles.fetchCalendarsButtonText}>Fetch Calendars</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.saveCalendarButton} onPress={handleSaveCalendar}>
        <Text style={styles.saveCalendarButtonText}>Save Calendar</Text>
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
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  pickerContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 150,
  },
  calendarPicker: {
    width: "90%",
    height: 50,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 12,
  },
  fetchCalendarsButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  fetchCalendarsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveCalendarButton: {
    backgroundColor: "#dedede", // Grey button
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16, // Adds space below the Save button
  },
  saveCalendarButtonText: {
    color: "#333", // Dark grey text
    fontSize: 16,
    fontWeight: "bold",
  },
});
