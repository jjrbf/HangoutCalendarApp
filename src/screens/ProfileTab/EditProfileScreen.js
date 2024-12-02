import React, { useState, useCallback, useEffect } from "react";
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
  const calendarId = route?.params?.calendarId; // Safely access calendarId
  const [calendar, setCalendar] = useState(null);
  const [owner, setOwner] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (!calendarId) {
      Alert.alert("Error", "Calendar ID is missing.");
      navigation.goBack();
      return;
    }

    fetchCalendarDetails();
  }, [calendarId]);

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

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (showMembers) {
              setShowMembers(false); // Go back to calendar view
            } else {
              navigation.goBack(); // Exit the screen
            }
          }}
        >
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
      ),
      headerTitle: showMembers ? "Members" : calendar?.name || "Calendar",
      headerTitleAlign: "center",
      headerRight: () =>
        !showMembers ? (
          <TouchableOpacity
            style={styles.headerRightButton}
            onPress={() => setShowMembers(true)}
          >
            <Icon name="account-group" size={24} color="black" />
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, calendar, showMembers]);

  const renderEvent = ({ item }) => (
    <TouchableOpacity style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text>{`Start: ${item.startDate.toDate().toLocaleString()}`}</Text>
      <Text>{`End: ${item.endDate.toDate().toLocaleString()}`}</Text>
    </TouchableOpacity>
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

  if (showMembers) {
    return (
      <View style={styles.container}>
        <FlatList
          data={
            owner
              ? [
                  owner,
                  ...members.filter((member) => member.id !== calendar?.ownerId),
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

  return (
    <View style={styles.container}>
      {calendar && (
        <>
          <TouchableOpacity
            style={styles.addEventButton}
            onPress={() => Alert.alert("Add Event", "Event creation coming soon!")}
          >
            <Text style={styles.addEventText}>Add Event</Text>
          </TouchableOpacity>
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
  backButton: {
    marginLeft: 16,
  },
  headerRightButton: {
    marginRight: 16,
  },
  addEventButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
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
  },
  noEventsText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 16,
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
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  memberUsername: {
    fontSize: 14,
    color: "#666",
  },
});
