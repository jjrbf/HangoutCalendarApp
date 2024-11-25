import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Button, StyleSheet, Alert, FlatList } from "react-native";
import { db, auth } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import MapView, { Marker } from "react-native-maps";

export default function EventDetailsScreen({ route, navigation }) {
  const { eventId, shared, calendarId } = route.params; // Get the eventId passed from MyCalendarScreen
  const [calendar, setCalendar] = useState(null);
  const [owner, setOwner] = useState(null);
  const [members, setMembers] = useState([]);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        if (shared) {
          const calendarDoc = doc(db, "calendars", calendarId);
          const calendarSnapshot = await getDoc(calendarDoc);
          if (calendarSnapshot.exists()) {
            const calendarData = calendarSnapshot.data();
            setCalendar({
              ...calendarData,
              id: calendarSnapshot.id,
            });

            // Fetch owner details
            const ownerRef = doc(db, "users", calendarData.ownerId);
            const ownerDoc = await getDoc(ownerRef);
            if (ownerDoc.exists()) {
              setOwner({ id: calendarData.ownerId, ...ownerDoc.data() });
            }
            // Fetch members' details
            const memberDetails = await Promise.all(
              calendarData.members.map(async (memberId) => {
                const memberRef = doc(db, "users", memberId);
                const memberDoc = await getDoc(memberRef);
                return memberDoc.exists()
                  ? { id: memberId, ...memberDoc.data() }
                  : null;
              })
            );
            setMembers(memberDetails.filter((member) => member)); // Filter out null values
          } else {
            setError("Calendar not found.");
          }
        }
        const eventDoc = shared
          ? doc(db, "calendars", calendarId, "events", eventId)
          : doc(
              db,
              "calendars",
              `personal_calendar_${auth.currentUser.uid}`,
              "events",
              eventId
            );
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

  const renderMember = ({ item }) => (
    <View
      style={[
        styles.memberItem,
        item.id === calendar?.ownerId ? styles.ownerItem : {},
      ]}
    >
      <Text style={styles.memberName}>
        {item.name} {item.id === calendar?.ownerId && "(Owner)"}
      </Text>
      <Text style={styles.memberUsername}>@{item.username}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.detailsContainer}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        {shared && (
          <>
            <Text style={styles.eventDetail}>Calendar: {calendar.name}</Text>
            <Text style={styles.sectionTitle}>Members:</Text>
            <FlatList
              data={
                owner
                  ? [
                      owner,
                      ...members.filter(
                        (member) => member.id !== calendar?.ownerId
                      ),
                    ]
                  : members
              }
              keyExtractor={(item) => item.id}
              renderItem={renderMember}
              style={styles.list}
            />
          </>
        )}
        <Text
          style={styles.eventDetail}
        >{`Start: ${event.startDate.toLocaleString()}`}</Text>
        <Text
          style={styles.eventDetail}
        >{`End: ${event.endDate.toLocaleString()}`}</Text>
        <Text
          style={styles.eventDetail}
        >{`Description: ${event.description}`}</Text>

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
              <Marker
                coordinate={{
                  latitude: event.location.latitude,
                  longitude: event.location.longitude,
                }}
              />
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
  list: {
    marginBottom: 16,
  },
  memberItem: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 8,
  },
  ownerItem: {
    backgroundColor: "#dfe7fd",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  memberUsername: {
    fontSize: 14,
    color: "#666",
  },
});
