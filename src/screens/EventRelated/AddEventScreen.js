import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Button, StyleSheet, Alert, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../../firebaseConfig";
import { Timetable } from "../../components";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function AddEventScreen({ route, navigation }) {
  const [events, setEvents] = useState([]);
  const userId = auth.currentUser.uid;

  // State variables for new event
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [originalDraft, setOriginalDraft] = useState({
    eventTitle: "",
    eventDescription: "",
    startDate: new Date(),
    endDate: new Date(),
  }); // to check if the draft has been changed
  const [changed, setChanged] = useState(false);
  const [invalidMessage, setInvalidMessage] = useState(null);
  const [location, setLocation] = useState(
    route.params.location ? route.params.location : null
  ); // Holds selected location data
  const { calendarId, shared } = route.params;
  const draftKey = `event_draft_${userId}_${shared ? calendarId : "personal"}`; // different keys for each calendar

  // Load draft when the screen is loaded
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem(draftKey);
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          setEventTitle(parsedDraft.eventTitle || "");
          setEventDescription(parsedDraft.eventDescription || "");
          setStartDate(new Date(parsedDraft.startDate || new Date()));
          setEndDate(new Date(parsedDraft.endDate || new Date()));

          // Save draft to a reference state for comparison
          setOriginalDraft({
            eventTitle: parsedDraft.eventTitle || "",
            eventDescription: parsedDraft.eventDescription || "",
            startDate: new Date(parsedDraft.startDate || new Date()),
            endDate: new Date(parsedDraft.endDate || new Date()),
          });
        }
      } catch (error) {
        console.error("Error loading draft: ", error);
      }
    };

    loadDraft();
  }, []);

  // Save draft when any field changes
  useEffect(() => {
    const saveDraft = async () => {
      const draft = {
        eventTitle,
        eventDescription,
        startDate,
        endDate,
      };
      try {
        await AsyncStorage.setItem(draftKey, JSON.stringify(draft));
      } catch (error) {
        console.error("Error saving draft: ", error);
      }
    };
    const checkIfChanged = () => {
      const hasChanged =
        eventTitle !== originalDraft.eventTitle ||
        eventDescription !== originalDraft.eventDescription ||
        startDate.getTime() !== originalDraft.startDate.getTime() ||
        endDate.getTime() !== originalDraft.endDate.getTime();

      setChanged(hasChanged);
    };

    checkIfChanged();
    saveDraft();
  }, [eventTitle, eventDescription, startDate, endDate]);

  // Clear draft after successful event submission
  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(draftKey);
      setChanged(false);
    } catch (error) {
      console.error("Error clearing draft: ", error);
    }
  };

  useEffect(() => {
    if (route.params?.selectedLocation) {
      setLocation(route.params.selectedLocation);
    }
  }, [route.params?.selectedLocation]); // Re-run when selectedLocation changes

  const handleAddEvent = async () => {

    const setEvent = async () => {
      const newEvent = {
        title: eventTitle,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        description: eventDescription,
        location: location || null,
      };
      try {
        const calendarIdToSet = shared
          ? calendarId
          : `personal_calendar_${userId}`;
        await addDoc(
          collection(db, "calendars", calendarIdToSet, "events"),
          newEvent
        );
        setEvents((prevEvents) => [...prevEvents, newEvent]);
        clearDraft();
        Alert.alert("Success", "Event added successfully!");
  
        // Reset fields after adding the event
        setEventTitle("");
        setEventDescription("");
        setStartDate(new Date());
        setEndDate(new Date());
        setLocation(null);
        setInvalidMessage(null);
        navigation.navigate(shared ? "Calendar" : "MyCalendarScreen", {
          calendarId: calendarId,
        });
      } catch (error) {
        console.error("Error adding event: ", error);
        Alert.alert("Error", "Could not add event.");
      }
    };

    if (invalidMessage != null) {
      Alert.alert(
        "Time Set Invalid",
        invalidMessage.message,
        invalidMessage.stop && [
          {
            text: "Go Back",
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel",
          },
          {
            text: "Add Event Anyway",
            onPress: () => {
              setEvent();
            },
          },
        ]
      );
    } else setEvent();
  };

  const handleLeaveScreen = () => {
    if (changed) {
      Alert.alert(
        "Keep Draft?",
        "You haven't finished filling out your event. Would you like to keep a draft for later?",
        [
          {
            text: "Delete Draft",
            onPress: () => {
              clearDraft();
              navigation.navigate(shared ? "Calendar" : "MyCalendarScreen", {
                calendarId,
              });
            },
            style: "cancel",
          },
          {
            text: "Keep Draft",
            onPress: () => {
              console.log(`Draft Kept at ${draftKey}`);
              navigation.navigate(shared ? "Calendar" : "MyCalendarScreen", {
                calendarId,
              });
            },
          },
        ]
      );
    } else if (invalidMessage != null) {
      clearDraft();
      navigation.navigate(shared ? "Calendar" : "MyCalendarScreen", {
        calendarId,
      });
    } else {
      navigation.navigate(shared ? "Calendar" : "MyCalendarScreen", {
        calendarId,
      });
    }
  };

  const handleTimeChange = (startDate, endDate) => {
    setStartDate(startDate);
    setEndDate(endDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Button title="Back to Screen" onPress={() => handleLeaveScreen()} />

      <Timetable
        calendarId={calendarId}
        onTimeChange={handleTimeChange}
        startDate={startDate}
        endDate={endDate}
        setInvalidMessage={setInvalidMessage}
      />
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Event Title"
          value={eventTitle}
          onChangeText={setEventTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Event Description"
          value={eventDescription}
          onChangeText={setEventDescription}
        />

        <Button
          title="Select Start Date"
          onPress={() => setShowStartPicker(true)}
        />
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartPicker(false);
              if (selectedDate) {
                setStartDate(selectedDate);
              }
            }}
          />
        )}
        <Button
          title="Select Start Time"
          onPress={() => setShowStartTimePicker(true)}
        />
        {showStartTimePicker && (
          <DateTimePicker
            value={startDate}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowStartTimePicker(false);
              if (selectedTime) {
                const updatedStartDate = new Date(startDate);
                updatedStartDate.setHours(selectedTime.getHours());
                updatedStartDate.setMinutes(selectedTime.getMinutes());
                setStartDate(updatedStartDate);
              }
            }}
          />
        )}
        <Text>Start Date: {startDate.toLocaleString()}</Text>

        <Button
          title="Select End Date"
          onPress={() => setShowEndPicker(true)}
        />
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndPicker(false);
              if (selectedDate) {
                setEndDate(selectedDate);
              }
            }}
          />
        )}
        <Button
          title="Select End Time"
          onPress={() => setShowEndTimePicker(true)}
        />
        {showEndTimePicker && (
          <DateTimePicker
            value={endDate}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowEndTimePicker(false);
              if (selectedTime) {
                const updatedEndDate = new Date(endDate);
                updatedEndDate.setHours(selectedTime.getHours());
                updatedEndDate.setMinutes(selectedTime.getMinutes());
                setEndDate(updatedEndDate);
              }
            }}
          />
        )}
        <Text>End Date: {endDate.toLocaleString()}</Text>

        <Text style={styles.locationText}>
          {location
            ? `Location set: Latitude ${location.latitude}, Longitude ${location.longitude}`
            : "No location set"}
        </Text>
        <Button
          title="Set Location"
          onPress={() =>
            navigation.navigate("SetLocation", {
              calendarId: calendarId,
              shared: shared,
            })
          }
        />

        <Button title="Add Event" onPress={handleAddEvent} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
  locationText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "bold",
  },
});
