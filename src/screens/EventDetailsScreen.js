import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { db, auth } from "../firebaseConfig"; // Import your Firestore configuration
import { doc, getDoc } from "firebase/firestore";
import MapView, { Marker } from "react-native-maps";

export default function EventDetailsScreen({ route, navigation }) {
  const { eventId } = route.params; // Get the eventId passed from MyCalendarScreen
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const eventDoc = doc(db, "calendars", `personal_calendar_${auth.currentUser.uid}`, "events", eventId);
        const eventSnapshot = await getDoc(eventDoc);
        if (eventSnapshot.exists()) {
          const eventData = eventSnapshot.data();
          setEvent({
            ...eventData,
            id: eventSnapshot.id,
          });
        } else {
          setError("Event not found.");
        }
      } catch (error) {
        console.error("Error fetching event details: ", error);
        setError("Error fetching event details.");
      }
    };

    fetchEventDetails();
  }, [eventId]);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.detailsContainer}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDetail}>{`Start: ${event.startDate.toLocaleString()}`}</Text>
        <Text style={styles.eventDetail}>{`End: ${event.endDate.toLocaleString()}`}</Text>
        <Text style={styles.eventDetail}>{`Description: ${event.description}`}</Text>

        {event.location && (
          <View style={styles.mapContainer}>
            <Text style={styles.mapTitle}>Event Location:</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: event.location.latitude,
                longitude: event.location.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              <Marker coordinate={{ latitude: event.location.latitude, longitude: event.location.longitude }} />
            </MapView>
          </View>
        )}
      </View>
      <Button title="Back to Calendar" onPress={() => navigation.goBack()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  eventDetail: {
    fontSize: 16,
    marginBottom: 5,
  },
  mapContainer: {
    marginTop: 20,
    height: 300,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
  },
});
