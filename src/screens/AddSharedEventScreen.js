import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Button, StyleSheet, Alert, TextInput } from "react-native";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function AddSharedEventScreen({ route, navigation }) {
  const [events, setEvents] = useState([]);
  const userId = auth.currentUser.uid;

  // State variables for new event
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [location, setLocation] = useState(null); // Holds selected location data

  // Get the calendarId from the route params
  const { calendarId } = route.params;

  useEffect(() => {
    // Retrieve location from route params if set in SetLocationScreen
    if (route.params?.selectedLocation) {
      setLocation(route.params.selectedLocation);
    }
  }, [calendarId, route.params?.selectedLocation]);

  const handleAddEvent = async () => {
    if (!eventTitle || !startDate || !endDate) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }

    const newEvent = {
      title: eventTitle,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      description: eventDescription,
      location: location || null,
    };

    try {
      await addDoc(collection(db, "calendars", calendarId, "events"), newEvent);
      Alert.alert("Success", "Event added successfully!");

      // Reset fields after adding the event
      setEventTitle("");
      setEventDescription("");
      setStartDate(new Date());
      setEndDate(new Date());
      setLocation(null);
      navigation.navigate("Calendar", { calendarId }); // Navigate back to the calendar screen
    } catch (error) {
      console.error("Error adding event: ", error);
      Alert.alert("Error", "Could not add event.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Button
        title="Back to Calendar"
        onPress={() => navigation.navigate("CalendarScreen", { calendarId })}
      />
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Event Title"
          value={eventTitle}
          onChangeText={setEventTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Event Description"
          value={eventDescription}
          onChangeText={setEventDescription}
        />

        <Button
          title="Select Start Date"
          onPress={() => setShowStartPicker(true)}
        />
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartPicker(false);
              if (selectedDate) {
                setStartDate(selectedDate);
              }
            }}
          />
        )}
        <Button
          title="Select Start Time"
          onPress={() => setShowStartTimePicker(true)}
        />
        {showStartTimePicker && (
          <DateTimePicker
            value={startDate}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowStartTimePicker(false);
              if (selectedTime) {
                const updatedStartDate = new Date(startDate);
                updatedStartDate.setHours(selectedTime.getHours());
                updatedStartDate.setMinutes(selectedTime.getMinutes());
                setStartDate(updatedStartDate);
              }
            }}
          />
        )}
        <Text>Start Date: {startDate.toLocaleString()}</Text>

        <Button
          title="Select End Date"
          onPress={() => setShowEndPicker(true)}
        />
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndPicker(false);
              if (selectedDate) {
                setEndDate(selectedDate);
              }
            }}
          />
        )}
        <Button
          title="Select End Time"
          onPress={() => setShowEndTimePicker(true)}
        />
        {showEndTimePicker && (
          <DateTimePicker
            value={endDate}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowEndTimePicker(false);
              if (selectedTime) {
                const updatedEndDate = new Date(endDate);
                updatedEndDate.setHours(selectedTime.getHours());
                updatedEndDate.setMinutes(selectedTime.getMinutes());
                setEndDate(updatedEndDate);
              }
            }}
          />
        )}
        <Text>End Date: {endDate.toLocaleString()}</Text>

        <Text style={styles.locationText}>
          {location
            ? `Location set: Latitude ${location.latitude}, Longitude ${location.longitude}`
            : "No location set"}
        </Text>
        <Button
          title="Set Location"
          onPress={() => navigation.navigate("SetLocationShared", { calendarId: calendarId })}
        />

        <Button title="Add Event" onPress={handleAddEvent} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
  locationText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "bold",
  },
});
