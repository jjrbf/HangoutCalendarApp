import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
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

export default function Timetable({
  calendarId,
  onTimeChange,
  startDate,
  endDate,
  setInvalidMessage,
}) {
  const [busyTimes, setBusyTimes] = useState([]);
  const [passedTimes, setPassedTimes] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    new Date(new Date().setHours(0, 0, 0, 0)) // Start of current day
  );

  const hoursPerDay = 24;
  const daysPerWeek = 7;

  // Fetch busy times for members and the owner
  useEffect(() => {
    const fetchBusyTimes = async () => {
      try {
        setLoading(true);

        const calendarDocRef = doc(db, "calendars", calendarId);
        const calendarSnapshot = await getDoc(calendarDocRef);

        if (!calendarSnapshot.exists()) {
          Alert.alert("Error", "Calendar not found.");
          setLoading(false);
          return;
        }

        const calendarData = calendarSnapshot.data();
        const { members, ownerId } = calendarData;
        const memberIds = [ownerId, ...members];
        const allBusyTimes = [];

        for (const memberId of memberIds) {
          const calendarsQuery = query(
            collection(db, "calendars"),
            where("members", "array-contains", memberId)
          );
          const calendarsSnapshot = await getDocs(calendarsQuery);

          for (const calendarDoc of calendarsSnapshot.docs) {
            const eventsCollection = collection(
              db,
              `calendars/${calendarDoc.id}/events`
            );
            const eventsSnapshot = await getDocs(eventsCollection);

            eventsSnapshot.forEach((eventDoc) => {
              const event = eventDoc.data();
              allBusyTimes.push({
                start: event.startDate.seconds * 1000,
                end: event.endDate.seconds * 1000,
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
  }, [calendarId, currentWeekStart]);

  // Generate timetable grid
  useEffect(() => {
    const grid = Array.from({ length: daysPerWeek }, (_, day) =>
      Array.from({ length: hoursPerDay * 2 }, (_, hour) => {
        const time =
          currentWeekStart.getTime() +
          day * 24 * 60 * 60 * 1000 +
          (hour / 2) * 60 * 60 * 1000;
        const overlappingEvents = busyTimes.filter(
          (busy) => time >= busy.start && time < busy.end
        );

        return { time, overlaps: overlappingEvents.length };
      })
    );

    setGridData(grid);

    const fetchPassedTimes = () => {
      const now = Date.now();
      const passed = grid
        .flat()
        .filter((cell) => cell.time < now)
        .map((cell) => cell.time);
      setPassedTimes(passed);
    };

    fetchPassedTimes();
  }, [busyTimes, currentWeekStart]);

  useEffect(() => {
    const cellsT = (endDate.getTime() - startDate.getTime()) / 1800000;
    let arr = [];
    for (let i = 0; i < cellsT; i++) {
      arr.push(startDate.getTime() + i * 1800000);
    }
    setSelectedTime(arr); // Update selected time
  }, [startDate, endDate]); // change selected time

  useEffect(() => {
    if (endDate.getTime() - startDate.getTime() < 0) {
      setInvalidMessage({
        message: "End date must be after the start date.",
        stop: false,
      });
      console.log("END DATE");
    } else if (
      Array.isArray(passedTimes) &&
      passedTimes.length > 0 &&
      (passedTimes[passedTimes.length - 1] - startDate.getTime() > 0 ||
        passedTimes[passedTimes.length - 1] - endDate.getTime() > 0)
    ) {
      setInvalidMessage({
        message: "Selected time must not be passed already.",
        stop: false,
      });
      console.log("PASSED TIME");
    } else {
      // Check for overlaps in gridData using similar logic
      let overlapFound = false;

      gridData.forEach((day) => {
        day.forEach((cell) => {
          if (
            selectedTime.includes(cell.time) && // Time matches a selected time
            cell.overlaps > 0 // There's an overlap
          ) {
            overlapFound = true;
          }
        });
      });

      if (overlapFound) {
        setInvalidMessage({
          message: "One or more members are busy during the selected time.",
          stop: true,
        });
        console.log("OVERLAP FOUND");
      } else {
        setInvalidMessage(null);
      }
    }
  }, [selectedTime]); // change selected time

  // Handle tap on a free slot
  const handleTap = (time) => {
    const start = new Date(time);
    const end = new Date(time + 60 * 60 * 1000 - 1800000); // Set end time to half an hour after start
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

  // Navigate weeks
  const goToNextWeek = () => {
    setCurrentWeekStart(
      new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    );
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(
      new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <TouchableOpacity onPress={goToPreviousWeek} style={styles.button}>
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.header}>
          Timetable ({currentWeekStart.toDateString()})
        </Text>
        <TouchableOpacity onPress={goToNextWeek} style={styles.button}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerRow}>
        <View style={styles.dayColumn}>
          <Text style={[styles.dayLabel, { width: 40 }]}>Hour</Text>
        </View>
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
          </View>
        ))}
      </View>
      <ScrollView>
        <View style={styles.grid}>
          <View style={styles.timeAxisHeader}>
            {Array.from({ length: 26 }).map((_, i) =>
              i > 0 ? (
                i < 14 ? (
                  <Text key={i} style={styles.hourLabel}>
                    {i == 1 ? "12AM -" : `${i - 1}${i == 13 ? "PM" : "AM"} -`}
                  </Text>
                ) : (
                  <Text key={i} style={styles.hourLabel}>
                    {`${i - 13}${i == 25 ? "AM" : "PM"} -`}
                  </Text>
                )
              ) : (
                console.log("")
              )
            )}
          </View>
          {gridData.map((day, dayIndex) => (
            <View key={dayIndex} style={styles.dayColumn}>
              {day.map((cell, hourIndex) => {
                const backgroundColor = passedTimes.includes(cell.time)
                  ? "gray"
                  : cell.overlaps > 0
                  ? `rgba(255, 0, 0, ${Math.min(cell.overlaps / 3, 1)})`
                  : selectedTime.includes(cell.time)
                  ? "orange"
                  : "rgba(0, 255, 0, 0.3)";

                return (
                  <TouchableOpacity
                    key={hourIndex}
                    style={[styles.cell, { backgroundColor }]}
                    onPress={() =>
                      cell.overlaps === 0 &&
                      !passedTimes.includes(cell.time) &&
                      handleTap(cell.time)
                    } // Only allow tapping on free slots
                  >
                    {(cell.overlaps > 0 || passedTimes.includes(cell.time)) &&
                      selectedTime.includes(cell.time) && (
                        <Text style={styles.errorText}>!!!</Text>
                      )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
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
    fontSize: 14,
    fontWeight: "bold",
  },
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
  },
  timeAxisHeader: {
    marginTop: -9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  dayColumn: {
    flex: 1,
    marginHorizontal: 2,
  },
  hourLabel: {
    height: 44,
    width: 40,
    fontSize: 10,
    marginRight: 5,
    textAlign: "right",
    fontWeight: "semibold",
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
  errorText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    textAlignVertical: "center",
    flex: 1,
  },
});
