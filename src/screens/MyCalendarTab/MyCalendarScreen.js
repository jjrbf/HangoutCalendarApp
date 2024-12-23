import React, { useState, useCallback, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { WeekToMonthCalendar } from "../../components";
import { useFocusEffect } from "@react-navigation/native";

// Displays a personalized calendar with events from the user's personal, shared, and device calendars
// Allows the user to view, scroll, delete events, and toggle between week and month views
export default function MyCalendarScreen({ route, navigation }) {
  const [isMonthView, setIsMonthView] = useState(false); // Used to change the layout after gesture handling

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today
  const [deviceCalendarEvents, setDeviceCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = auth.currentUser.uid;

  // Fetch device calendar events
  useEffect(() => {
    const fetchStoredCalendar = async () => {
      try {
        const storedCalendar = await AsyncStorage.getItem(  // Gets item from ASYNCSTORAGE
          "@device_calendar_imported"
        );

        if (storedCalendar) {
          const selectedCalendar = JSON.parse(storedCalendar); // Parse the stored calendar
          const { status } = await Calendar.requestCalendarPermissionsAsync();  // Requests calendar permission
          if (status !== "granted") {
            Alert.alert(
              "Permission Denied",
              "You need to allow access to your calendar."
            );
            return;
          }
          const now = new Date();
          const oneDayBefore = new Date(now.getTime() - 1000 * 60 * 60 * 24); // In milliseconds, get it from 1 day before
          const oneMonthAfter = new Date(  // In milliseconds, same thing for month after
            now.getTime() + 1000 * 60 * 60 * 24 * 30
          );

          const eventsList = await Calendar.getEventsAsync( // Gets calendar events from one day before to 1 month after
            [selectedCalendar.id], // Use selected calendar ID
            oneDayBefore,
            oneMonthAfter
          );

          const formattedEvents = eventsList.map((event) => ({  // Formats the events
            id: event.id,
            calendarId: selectedCalendar.id,
            title: event.title,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
            description: event.notes || "",
            shared: false, // Device events are considered personal
            deviceEvent: true, // Tag for device calendar events
          }));

          setDeviceCalendarEvents(formattedEvents);

          // Extract busyTimes
          const busyTimes = formattedEvents.map((event) => ({
            startTime: event.startDate.getTime(),
            endTime: event.endDate.getTime(),
          }));

          // Update Firestore with busyTimes to allow other users to get their times when busy for scheduling
          const userDocRef = doc(db, "users", userId);
          await updateDoc(userDocRef, {
            busyTimes: busyTimes,
          });
        }
      } catch (error) {
        console.error("Error loading stored calendar:", error);
      }
    };

    fetchStoredCalendar();
  }, []);

  // Fetch personal and shared events
  const fetchEvents = async () => {
    setLoading(true); // Start loading
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

      const [ // Awaits all snapshots
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

      // Combine personal, shared, and device calendar events
      const allEvents = [
        ...personalEvents,
        ...sharedEvents,
        ...deviceCalendarEvents,
      ];
      setEvents(allEvents);
      filterEvents(allEvents, selectedDate);
    } catch (error) {
      console.error("Error fetching events: ", error);
      Alert.alert("Error", "Could not fetch events.");
    } finally {
      setLoading(false); // End loading
    }
  };

  // Filter events by selected day
  const filterEvents = (eventsList, date) => {
    const filtered = eventsList.filter(
      (event) => event.startDate.toDateString() === date.toDateString() // Match only the selected day
    );
    setFilteredEvents(filtered);
  };

  // Used to handle the date change from the WeekToMonthCalendar.js component
  const handleDateChange = (date) => {
    setSelectedDate(date);
    filterEvents(events, date);
  };

  // Used to handle the view change (from month to week view) from the WeekToMonthCalendar.js component
  const handleViewChange = (viewState) => {
    setIsMonthView(viewState);
  };

  // Deletes events from Firestore
  const handleDeleteEvent = async (eventId, calendarId, shared) => {
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
                shared ? calendarId : `personal_calendar_${userId}`,
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

  // Refreshes when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [userId, deviceCalendarEvents])
  );

  return (
    <SafeAreaView style={styles.container}>
      <WeekToMonthCalendar // Custom component to show the calendar (maybe we should've used the RN Calendar)
        onDateChange={handleDateChange}
        onViewChange={handleViewChange}
        style={{ flex: 1 }}
      />

      <View
        style={
          isMonthView ? styles.eventsContainerMonth : styles.eventsContainerWeek  // Change layout if month or week view
        }
      >
        {loading ? ( // Show loading indicator
          <ActivityIndicator size="large" color="#007bff" />
        ) : filteredEvents.length > 0 ? ( // Check for empty array
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => `${item.calendarId}_${item.id}`}
            renderItem={({ item }) => (
              <View style={styles.eventItem}>
                <Text style={styles.eventTitle}>
                  {item.title}{" "}
                  {item.shared
                    ? "(Shared)"
                    : item.deviceEvent
                    ? "(Device)"
                    : "(Personal)"}
                </Text>
                <Text
                  style={styles.timeText}
                >{`${item.startDate.toLocaleString()} - ${item.endDate.toLocaleString()}`}</Text>
                {item.description && (
                  <Text style={styles.descriptionText}>{item.description}</Text>
                )}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => {
                      if (item.deviceEvent) {
                        // Redirect to native calendar for device events
                        if (Platform.OS === "ios") {
                          Linking.openURL(
                            `calshow:${item.startDate.getTime() / 1000}`
                          ); // Open iOS calendar event
                        } else if (Platform.OS === "android") {
                          Linking.openURL(
                            "content://com.android.calendar/time/"
                          ); // Open Android calendar app
                        } else {
                          Alert.alert(
                            "Unsupported Platform",
                            "Cannot open the calendar on this platform."
                          );
                        }
                      } else {
                        // Navigate to your EventDetails screen for non-device events
                        navigation.navigate("EventDetails", {
                          eventId: item.id,
                          calendarId: item.calendarId,
                          shared: item.shared,
                        });
                      }
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>See More</Text>
                  </TouchableOpacity>
                  {!item.deviceEvent && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() =>
                        handleDeleteEvent(item.id, item.calendarId, item.shared)
                      }
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noEventsText}>
            No events found. Create an event!
          </Text> // Show this message when there are no events
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  eventsContainerMonth: {
    flex: 1,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  eventsContainerWeek: {
    flex: 3.5,
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  eventItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  eventTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  timeText: {
    fontSize: 14,
  },
  descriptionText: {
    fontSize: 14,
    marginTop: 6,
    padding: 8,
    color: "d3d3d3",
    fontStyle: "italic",
    borderColor: "#d3d3d3",
    borderWidth: 1,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  noEventsText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 16,
  },
  secondaryButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#ffeaea",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#8c0b0b",
    fontSize: 16,
    fontWeight: "bold",
  },
});
