import React, { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Button, FlatList, StyleSheet, Alert } from "react-native";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { CalendarSwitcher } from "../../components";
import { useFocusEffect } from "@react-navigation/native";

export default function MyCalendarScreen({ route, navigation }) {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today
  const userId = auth.currentUser.uid;

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
      filterEvents(eventsList, selectedDate);
    } catch (error) {
      console.error("Error fetching events: ", error);
      Alert.alert("Error", "Could not fetch events.");
    }
  };

  const filterEvents = (eventsList, date) => {
    const filtered = eventsList.filter(
      (event) =>
        event.startDate.toDateString() === date.toDateString() // Match only the selected day
    );
    setFilteredEvents(filtered);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    filterEvents(events, date);
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
