import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Button, FlatList, StyleSheet, Alert } from "react-native";
import { db, auth } from "../firebaseConfig"; // Import your Firestore and Auth configuration
import { collection, getDocs, addDoc } from "firebase/firestore"; 
import { CalendarSwitcher } from "../components";

export default function MyCalendarScreen() {
  const [events, setEvents] = useState([]);
  const userId = auth.currentUser.uid; // Get the currently authenticated user's ID


  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const calendarId = `personal_calendar_${userId}`; // Construct the personal calendar ID
        const eventsCollection = collection(db, "calendars", calendarId, "events");
        const eventsSnapshot = await getDocs(eventsCollection);
        
        const eventsList = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventsList);
      } catch (error) {
        console.error("Error fetching events: ", error);
        Alert.alert("Error", "Could not fetch events.");
      }
    };

    fetchEvents();
  }, [userId]); // Add userId as a dependency to refetch if it changes

  const handleAddEvent = async () => {
    const newEvent = {
      title: "New Event", // You can customize this to come from user input
      date: new Date(), // You would likely want to allow users to pick a date
      description: "Event description", // Allow users to input this
    };

    try {
      const calendarId = `personal_calendar_${userId}`;
      await addDoc(collection(db, "calendars", calendarId, "events"), newEvent);
      setEvents(prevEvents => [...prevEvents, newEvent]); // Update local state for immediate UI feedback
      Alert.alert("Success", "Event added successfully!");
    } catch (error) {
      console.error("Error adding event: ", error);
      Alert.alert("Error", "Could not add event.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CalendarSwitcher />
      <View style={styles.eventsContainer}>
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventItem}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text>{item.date.toString()}</Text>
              <Text>{item.description}</Text>
            </View>
          )}
        />
      </View>
      <Button title="Add Event" onPress={handleAddEvent} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
