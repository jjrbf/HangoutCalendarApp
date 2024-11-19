import React, { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Button, FlatList, StyleSheet, Alert } from "react-native";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { CalendarSwitcher } from "../../components";
import { useFocusEffect } from "@react-navigation/native";

export default function MyCalendarScreen({ route, navigation }) {
  const [events, setEvents] = useState([]);
  const userId = auth.currentUser.uid;

  // Fetch events from Firestore
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

  // Use useFocusEffect to fetch events whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [userId])
  );

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

  const handleDeleteEvent = async (eventId) => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const eventDoc = doc(
                db,
                "calendars",
                `personal_calendar_${userId}`,
                "events",
                eventId
              );
              await deleteDoc(eventDoc);
              setEvents((prevEvents) =>
                prevEvents.filter((event) => event.id !== eventId)
              );
              Alert.alert("Success", "Event deleted successfully!");
            } catch (error) {
              console.error("Error deleting event: ", error);
              Alert.alert("Error", "Could not delete event.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CalendarSwitcher />
      <Button
        title="Add Event"
        onPress={() =>
          navigation.navigate("AddEvent", {
            calendarId: `personal_calendar_${userId}`,
          })
        }
      />
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
              <View style={styles.buttonContainer}>
                <Button
                  title="See More"
                  onPress={() =>
                    navigation.navigate("EventDetails", { eventId: item.id })
                  }
                />
                <Button
                  title="Delete"
                  onPress={() => handleDeleteEvent(item.id)}
                />
              </View>
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});
