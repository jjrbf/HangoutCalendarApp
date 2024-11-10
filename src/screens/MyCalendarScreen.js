import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Button, FlatList, StyleSheet, Alert } from "react-native";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { CalendarSwitcher } from "../components";
import { Timestamp } from "firebase/firestore";

export default function MyCalendarScreen({ route, navigation }) {
  const [events, setEvents] = useState([]);
  const userId = auth.currentUser.uid;

  // State variables for new event
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

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
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          description: data.description,
        };
      });
      setEvents(eventsList);
    } catch (error) {
      console.error("Error fetching events: ", error);
      Alert.alert("Error", "Could not fetch events.");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [userId]);

  const handleAddEvent = async () => {
    const newEvent = {
      title: eventTitle,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      description: eventDescription,
    };

    try {
      const calendarId = `personal_calendar_${userId}`;
      await addDoc(collection(db, "calendars", calendarId, "events"), newEvent);
      setEvents((prevEvents) => [...prevEvents, newEvent]);
      Alert.alert("Success", "Event added successfully!");
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
      <Button
        title="Add Event"
        onPress={() => navigation.navigate("AddEvent")}
      />
      <Button title="Refresh Events" onPress={fetchEvents} />
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
