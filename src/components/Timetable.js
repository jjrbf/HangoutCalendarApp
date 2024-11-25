import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { db } from "../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export default function Timetable({ calendarId, onTimeChange }) {
  const [busyTimes, setBusyTimes] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(true);

  const hoursPerDay = 24;
  const daysPerWeek = 7;

  // Fetch busy times for members and the owner
  useEffect(() => {
    const fetchBusyTimes = async () => {
      try {
        setLoading(true);

        // Step 1: Fetch calendar data
        const calendarDocRef = doc(db, "calendars", calendarId);
        const calendarSnapshot = await getDoc(calendarDocRef);

        if (!calendarSnapshot.exists()) {
          Alert.alert("Error", "Calendar not found.");
          setLoading(false);
          return;
        }

        const calendarData = calendarSnapshot.data();
        const { members, ownerId } = calendarData;

        // Step 2: Collect all member IDs (owner + members)
        const memberIds = [ownerId, ...members];

        // Step 3: Fetch events for each member
        const allBusyTimes = [];

        for (const memberId of memberIds) {
          // Query calendars where the member is in the members array
          const calendarsQuery = query(
            collection(db, "calendars"),
            where("members", "array-contains", memberId)
          );

          // Fetch all calendars matching the query
          const calendarsSnapshot = await getDocs(calendarsQuery);

          for (const calendarDoc of calendarsSnapshot.docs) {
            const calendarId = calendarDoc.id;

            // Reference to the events subcollection of the current calendar
            const eventsCollection = collection(
              db,
              `calendars/${calendarId}/events`
            );

            // Fetch all events from the events subcollection
            const eventsSnapshot = await getDocs(eventsCollection);

            // Process each event in the events subcollection
            eventsSnapshot.forEach((eventDoc) => {
              const event = eventDoc.data();

              // Use the seconds property of the Firestore Timestamp
              allBusyTimes.push({
                start: event.startDate.seconds * 1000, // Convert seconds to milliseconds
                end: event.endDate.seconds * 1000, // Convert seconds to milliseconds
              });
            });
          }
        }

        setBusyTimes(allBusyTimes);
      } catch (error) {
        console.error("Error fetching busy times:", error);
        Alert.alert("Error", "An error occurred while fetching busy times.");
      } finally {
        setLoading(false);
      }
    };

    fetchBusyTimes();
  }, [calendarId]);

  // Generate timetable grid
  useEffect(() => {
    if (busyTimes.length === 0) {
      setGridData([]);
      return;
    }

    const now = new Date();
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay() // Start of this week (Sunday)
    );

    const grid = Array.from({ length: daysPerWeek }, (_, day) =>
      Array.from({ length: hoursPerDay }, (_, hour) => {
        const time = new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate() + day,
          hour
        ).getTime();

        const overlappingEvents = busyTimes.filter(
          (busy) => time >= busy.start && time < busy.end
        );

        return { time, overlaps: overlappingEvents.length };
      })
    );

    setGridData(grid);
  }, [busyTimes]);

  // Handle tap on a free slot
  const handleTap = (time) => {
    const start = new Date(time);
    const end = new Date(time + 60 * 60 * 1000); // Set end time to 1 hour after start
    onTimeChange(start, end);
    Alert.alert("Time Selected", `Start: ${start}, End: ${end}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading timetable...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Timetable</Text>
      <View style={styles.grid}>
        {gridData.map((day, dayIndex) => (
          <View key={dayIndex} style={styles.dayColumn}>
            <Text style={styles.dayLabel}>
              {new Date(gridData[dayIndex][0].time).toLocaleDateString(
                "en-US",
                {
                  weekday: "short",
                }
              )}
            </Text>
            {day.map((cell, hourIndex) => {
              const backgroundColor =
                cell.overlaps > 0
                  ? `rgba(255, 0, 0, ${Math.min(cell.overlaps / 3, 1)})` // Darker red for more overlaps
                  : "rgba(0, 255, 0, 0.3)"; // Green for free time

              return (
                <TouchableOpacity
                  key={hourIndex}
                  style={[styles.cell, { backgroundColor }]}
                  onPress={() => cell.overlaps === 0 && handleTap(cell.time)} // Only allow tapping on free slots
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayColumn: {
    flex: 1,
    marginHorizontal: 2,
  },
  dayLabel: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 5,
    fontWeight: "bold",
  },
  cell: {
    height: 20,
    marginVertical: 1,
    borderRadius: 3,
  },
});
