import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ProfilePicture } from "../../components";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../firebaseConfig";

export default function CalendarScreen({ route, navigation }) {
  const { calendarId } = route.params;
  const [calendar, setCalendar] = useState(null);
  const [owner, setOwner] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [showMembers, setShowMembers] = useState(false); // State to toggle views

  // Gets the calendardetails from Firestore
  const fetchCalendarDetails = async () => {
    try {
      const calendarRef = doc(db, "calendars", calendarId);
      const calendarDoc = await getDoc(calendarRef);

      if (!calendarDoc.exists()) {
        Alert.alert("Error", "Calendar not found.");
        navigation.goBack();
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

      // Fetch members
      const memberDetails = await Promise.all(
        calendarData.members.map(async (memberId) => {
          const memberRef = doc(db, "users", memberId);
          const memberDoc = await getDoc(memberRef);
          return memberDoc.exists()
            ? { id: memberId, ...memberDoc.data() }
            : null;
        })
      );
      setMembers(memberDetails.filter((member) => member));

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

  // Refetches the calendar details when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchCalendarDetails();
    }, [calendarId])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (showMembers) {
              // Navigate back to calendar view
              setShowMembers(false);
            } else {
              // Navigate back to the previous screen
              navigation.goBack();
            }
          }}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() => setShowMembers(true)} // Open members view
        >
          <Text style={styles.headerTitle}>
            {showMembers ? "Members" : calendar?.name || "Calendar"}
          </Text>
          {!showMembers && (
            <Icon name="chevron-right" size={24} color="black" />
          )}
        </TouchableOpacity>
      ),
      headerTitleAlign: "center",
    });
  }, [navigation, calendar, showMembers]);

  // Function to render the event below in the FlatList
  const renderEvent = ({ item }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() =>
        navigation.navigate("EventDetails", {
          eventId: item.id,
          calendarId: calendarId,
          shared: true, // Indicates this is a shared calendar
        })
      }
    >
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text
        style={styles.timeText}
      >{`${item.startDate.toDate().toLocaleString()} - ${item.endDate.toDate().toLocaleString()}`}</Text>
      {item.description && (
        <Text style={styles.descriptionText}>{item.description}</Text>
      )}
    </TouchableOpacity>
  );

  // Same thing as above but for the member
  // Different styling if it's the owner to differentiate 
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

  if (showMembers) {
    // Render members list view
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

  // Render main calendar view
  return (
    <View style={styles.container}>
      {calendar && (
        <>
          <Text style={styles.sectionTitle}>Group Events:</Text>
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
          <TouchableOpacity
            style={styles.addEventButton}
            onPress={() =>
              navigation.navigate("AddEvent", {
                calendarId: calendarId,
                shared: true,
              })
            }
          >
            <Text style={styles.addEventText}>Add Group Event</Text>
          </TouchableOpacity>
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
  backButton: {
    marginLeft: 16,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  addEventButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 6,
  },
  addEventText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 8,
  },
  list: {
    marginBottom: 16,
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
  noEventsText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 8,
  },
  ownerItem: {
    backgroundColor: "#dfe7fd",
  },
  memberInfo: {
    marginLeft: 12,
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
