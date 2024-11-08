import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { db, auth } from "../firebaseConfig"; // Import your Firestore and Auth configuration
import { collection, getDocs, addDoc } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarSwitcher } from "../components";
import { Timestamp } from "firebase/firestore";

export default function MyCalendarScreen() {
  const [events, setEvents] = useState([]);
  const userId = auth.currentUser.uid; // Get the currently authenticated user's ID

  // State variables for new event
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const calendarId = `personal_calendar_${userId}`;
        const eventsCollection = collection(
          db,
          "calendars",
          calendarId,
          "events"
        );
        const eventsSnapshot = await getDocs(eventsCollection);

        const eventsList = eventsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            startDate: data.startDate.toDate(), // Convert Firestore Timestamp to Date
            endDate: data.endDate.toDate(), // Convert Firestore Timestamp to Date
            description: data.description,
          };
        });
        setEvents(eventsList);
      } catch (error) {
        console.error("Error fetching events: ", error);
        Alert.alert("Error", "Could not fetch events.");
      }
    };

    fetchEvents();
  }, [userId]);

  const handleAddEvent = async () => {
    const newEvent = {
      title: eventTitle,
      startDate: Timestamp.fromDate(startDate), // Use Firestore's Timestamp
      endDate: Timestamp.fromDate(endDate), // Use Firestore's Timestamp
      description: eventDescription,
    };

    try {
      const calendarId = `personal_calendar_${userId}`;
      await addDoc(collection(db, "calendars", calendarId, "events"), newEvent);
      setEvents((prevEvents) => [...prevEvents, newEvent]); // Update local state for immediate UI feedback
      Alert.alert("Success", "Event added successfully!");
      // Reset fields after adding the event
      setEventTitle("");
      setEventDescription("");
      setStartDate(new Date());
      setEndDate(new Date());
    } catch (error) {
      console.error("Error adding event: ", error);
      Alert.alert("Error", "Could not add event.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CalendarSwitcher />
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
                updatedStartDate.setHours(
                  selectedTime.nativeEvent.timestamp.getHours()
                );
                updatedStartDate.setMinutes(
                  selectedTime.nativeEvent.timestamp.getMinutes()
                );
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
                updatedEndDate.setHours(
                  selectedTime.nativeEvent.timestamp.getHours()
                );
                updatedEndDate.setMinutes(
                  selectedTime.nativeEvent.timestamp.getMinutes()
                );
                setEndDate(updatedEndDate);
              }
            }}
          />
        )}
        <Text>End Date: {endDate.toLocaleString()}</Text>

        <Button title="Add Event" onPress={handleAddEvent} />
      </View>
      <View style={styles.eventsContainer}>
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventItem}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text>{`Start: ${item.startDate.toLocaleString()}`}</Text>
              <Text>{`End: ${item.endDate.toLocaleString()}`}</Text>
              <Text>{item.description}</Text>
            </View>
          )}
        />
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
  eventsContainer: {
    flex: 1,
    marginBottom: 16,
  },
  eventItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
  },
  eventTitle: {
    fontWeight: "bold",
  },
});
