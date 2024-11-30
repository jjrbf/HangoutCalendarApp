import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Button,
  Alert,
} from "react-native";
import { auth, db } from "../../firebaseConfig";
import { ProfilePicture } from "../../components";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

export default function CalendarScreen({ route, navigation }) {
  const { calendarId } = route.params; // Get the calendarId from route params
  const [calendar, setCalendar] = useState(null);
  const [owner, setOwner] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);

  const fetchCalendarDetails = async () => {
    try {
      const calendarRef = doc(db, "calendars", calendarId);
      const calendarDoc = await getDoc(calendarRef);

      if (!calendarDoc.exists()) {
        Alert.alert("Error", "Calendar not found.");
        return;
      }

      const calendarData = calendarDoc.data();
      setCalendar(calendarData);

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

      // Fetch events
      const eventsRef = collection(db, "calendars", calendarId, "events");
      const eventsSnapshot = await getDocs(eventsRef);
      const fetchedEvents = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching calendar details:", error);
      Alert.alert("Error", "Unable to fetch calendar details.");
    }
  };

  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCalendarDetails();
    }, [calendarId])
  );

  const renderMember = ({ item }) => (
    <View
      style={[
        styles.memberItem,
        item.id === calendar?.ownerId ? styles.ownerItem : {},
      ]}
    >
      <ProfilePicture userId={item.id} size={50} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {item.name} {item.id === calendar?.ownerId && "(Owner)"}
        </Text>
        <Text style={styles.memberUsername}>@{item.username}</Text>
      </View>
    </View>
  );

  const renderEvent = ({ item }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() =>
        navigation.navigate("EventDetails", {
          eventId: item.id,
          shared: true,
          calendarId: calendarId,
        })
      }
    >
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text>{`Start: ${item.startDate.toDate().toLocaleString()}`}</Text>
      <Text>{`End: ${item.endDate.toDate().toLocaleString()}`}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {calendar && (
        <>
          <Text style={styles.calendarName}>{calendar.name}</Text>
          <Button
            title="Add Event"
            onPress={() =>
              navigation.navigate("AddEvent", { calendarId: calendarId, shared: true })
            }
          />
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
          <Text style={styles.sectionTitle}>Events:</Text>
          {events.length > 0 ? (
            <FlatList
              data={events}
              keyExtractor={(item) => item.id}
              renderItem={renderEvent}
              style={styles.list}
            />
          ) : (
            <Text style={styles.noEventsText}>No events added yet.</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  calendarName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 8,
  },
  list: {
    marginBottom: 16,
  },
  memberItem: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
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
  eventItem: {
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  eventDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: "#333",
  },
  noEventsText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 16,
  },
});
