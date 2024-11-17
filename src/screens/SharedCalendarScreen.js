import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  FlatList,
  View,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { auth, db } from "../firebaseConfig"; // Import Firebase config
import { collection, query, where, getDocs } from "firebase/firestore"; // Firestore functions

export default function SharedCalendarScreen({ navigation }) {
  const [calendars, setCalendars] = useState([]);
  const [ownedCalendars, setOwnedCalendars] = useState([]);
  const userId = auth.currentUser.uid;

  useEffect(() => {
    const fetchSharedCalendars = async () => {
      try {
        const calendarsCollection = collection(db, "calendars");
        const q = query(
          calendarsCollection,
          where("members", "array-contains", userId)
        );
        const querySnapshot = await getDocs(q);

        // Exclude calendars with prefix "personal_calendar_"
        const fetchedCalendars = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((calendar) => !calendar.id.startsWith("personal_calendar_"));

        setCalendars(fetchedCalendars);
      } catch (error) {
        console.error("Error fetching shared calendars:", error);
      }
    };

    fetchSharedCalendars();
  }, [userId]);

  useEffect(() => {
    const fetchSharedCalendars = async () => {
      try {
        const calendarsCollection = collection(db, "calendars");
        const q = query(calendarsCollection, where("ownerId", "==", userId));
        const querySnapshot = await getDocs(q);

        // Exclude calendars with prefix "personal_calendar_"
        const fetchedCalendars = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((calendar) => !calendar.id.startsWith("personal_calendar_"));

        setOwnedCalendars(fetchedCalendars);
      } catch (error) {
        console.error("Error fetching shared calendars:", error);
      }
    };

    fetchSharedCalendars();
  }, [userId]);

  const renderCalendar = ({ item }) => (
    <TouchableOpacity
      style={styles.calendarItem}
      onPress={() => navigation.navigate("Calendar", { calendarId: item.id })}
    >
      <Text style={styles.calendarName}>{item.name}</Text>
      <Text style={styles.calendarOwner}>
        Owner: {item.ownerId === userId ? "You" : item.ownerId}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Shared Calendars</Text>

      <Text style={styles.subtitle}>Your Shared Calendars</Text>

      <FlatList
        data={ownedCalendars}
        keyExtractor={(item) => item.id}
        renderItem={renderCalendar}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No shared calendars found.</Text>
        }
      />

      <Text style={styles.subtitle}>Calendars Shared With You</Text>

      <FlatList
        data={calendars}
        keyExtractor={(item) => item.id}
        renderItem={renderCalendar}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No shared calendars found.</Text>
        }
      />

      <Button
        title="New Calendar"
        onPress={() => navigation.navigate("CreateCalendar")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  calendarItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
  },
  calendarName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  calendarOwner: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});
