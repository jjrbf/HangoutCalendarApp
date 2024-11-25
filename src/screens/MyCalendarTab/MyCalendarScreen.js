import React, { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Button, FlatList, StyleSheet, Alert } from "react-native";
import { db, auth } from "../../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { CalendarSwitcher } from "../../components";
import { useFocusEffect } from "@react-navigation/native";

export default function MyCalendarScreen({ route, navigation }) {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today
  const userId = auth.currentUser.uid;

  // Fetch events from both personal and shared calendars
  const fetchEvents = async () => {
    try {
      // User's personal calendar
      const personalCalendarId = `personal_calendar_${userId}`;
      const personalEventsCollection = collection(
        db,
        "calendars",
        personalCalendarId,
        "events"
      );

      // Shared calendars where the user is a member or the owner
      const sharedCalendarsQuery = query(
        collection(db, "calendars"),
        where("members", "array-contains", userId)
      );
      const ownedSharedCalendarsQuery = query(
        collection(db, "calendars"),
        where("ownerId", "==", userId)
      );

      const [
        personalEventsSnapshot,
        sharedCalendarsSnapshot,
        ownedSharedCalendarsSnapshot,
      ] = await Promise.all([
        getDocs(personalEventsCollection),
        getDocs(sharedCalendarsQuery),
        getDocs(ownedSharedCalendarsQuery),
      ]);

      // Fetch personal events
      const personalEvents = personalEventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        calendarId: personalCalendarId,
        shared: false,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate.toDate(),
      }));

      // Combine shared calendars from both queries
      const sharedCalendars = [
        ...sharedCalendarsSnapshot.docs,
        ...ownedSharedCalendarsSnapshot.docs,
      ].filter((calendar) => calendar.id != `personal_calendar_${userId}`); // filters out the personal calendar events from the query

      // Fetch events from shared calendars
      const sharedEventsPromises = sharedCalendars.map((calendarDoc) =>
        getDocs(collection(db, "calendars", calendarDoc.id, "events")).then(
          (eventsSnapshot) =>
            eventsSnapshot.docs.map((eventDoc) => ({
              id: eventDoc.id,
              calendarId: calendarDoc.id,
              shared: true,
              ...eventDoc.data(),
              startDate: eventDoc.data().startDate.toDate(),
              endDate: eventDoc.data().endDate.toDate(),
            }))
        )
      );

      const sharedEvents = (await Promise.all(sharedEventsPromises)).flat();

      const allEvents = [...personalEvents, ...sharedEvents];
      setEvents(allEvents);
      filterEvents(allEvents, selectedDate);
    } catch (error) {
      console.error("Error fetching events: ", error);
      Alert.alert("Error", "Could not fetch events.");
    }
  };

  const filterEvents = (eventsList, date) => {
    const filtered = eventsList.filter(
      (event) => event.startDate.toDateString() === date.toDateString() // Match only the selected day
    );
    setFilteredEvents(filtered);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    filterEvents(events, date);
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

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [userId])
  );

  return (
    <SafeAreaView style={styles.container}>
      <CalendarSwitcher onDateChange={handleDateChange} />
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
          data={filteredEvents}
          keyExtractor={(item) => `${item.calendarId}_${item.id}`} // Unique key
          renderItem={({ item }) => (
            <View style={styles.eventItem}>
              <Text style={styles.eventTitle}>
                {item.title} {item.shared ? "(Shared)" : "(Personal)"}
              </Text>
              <Text>{`Start: ${item.startDate.toLocaleString()}`}</Text>
              <Text>{`End: ${item.endDate.toLocaleString()}`}</Text>
              <Text>{item.description}</Text>
              <View style={styles.buttonContainer}>
                <Button
                  title="See More"
                  onPress={() =>
                    navigation.navigate("EventDetails", {
                      eventId: item.id,
                      calendarId: item.calendarId,
                      shared: item.shared,
                    })
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
