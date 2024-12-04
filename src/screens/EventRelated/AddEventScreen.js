import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../../firebaseConfig";
import { Timetable } from "../../components";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
// import DateTimePicker from "@react-native-community/datetimepicker";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function AddEventScreen({ route, navigation }) {
  const now = new Date(); // Current date and time
  const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes later

  const [events, setEvents] = useState([]);
  const [showTimetable, setShowTimetable] = useState(false);
  const userId = auth.currentUser.uid;

  // State variables for new event
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [startDate, setStartDate] = useState(now);
  const [endDate, setEndDate] = useState(fifteenMinutesLater);
  // new date picker stuff
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);
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

          const loadedStartDate = new Date(parsedDraft.startDate || new Date());
          let loadedEndDate = new Date(parsedDraft.endDate || new Date());

          // Ensure the `endDate` is at least 15 minutes after the `startDate`
          if (loadedEndDate <= loadedStartDate) {
            loadedEndDate = new Date(
              loadedStartDate.getTime() + 15 * 60 * 1000
            );
          }

          setEventTitle(parsedDraft.eventTitle || "");
          setEventDescription(parsedDraft.eventDescription || "");
          setStartDate(loadedStartDate);
          setEndDate(loadedEndDate);

          setOriginalDraft({
            eventTitle: parsedDraft.eventTitle || "",
            eventDescription: parsedDraft.eventDescription || "",
            startDate: loadedStartDate,
            endDate: loadedEndDate,
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

  // Allows the flow of the location data between screens
  useEffect(() => {
    if (route.params?.selectedLocation) {
      setLocation(route.params.selectedLocation);
    }
  }, [route.params?.selectedLocation]); // Re-run when selectedLocation changes

  // Function to add an event
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

  // Ran when pressing the cancel button, asks the user if they want to keep a draft if they changed anything
  const handleLeaveScreen = () => {
    if (changed) {
      Alert.alert(  // Alert that runs if it's changed
        "Keep Draft?",
        "You haven't finished filling out your event. Would you like to keep a draft for later?",
        [
          {
            text: "Delete Draft",
            onPress: () => {
              clearDraft(); // Clears the draft
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

  // Function that updates the time change
  const handleTimeChange = (startDate, endDate) => {
    setStartDate(startDate);
    setEndDate(endDate);
  };

  const handleStartDateConfirm = (date) => {
    const updatedStartDate = new Date(date);
    updatedStartDate.setHours(startDate.getHours());
    updatedStartDate.setMinutes(startDate.getMinutes());

    if (validateEventTiming(updatedStartDate, endDate)) {
      setStartDate(updatedStartDate);
    }
    setStartDatePickerVisible(false);
  };

  const handleEndDateConfirm = (date) => {
    const updatedEndDate = new Date(date);

    // Ensure time consistency by carrying over the current time from `endDate`
    updatedEndDate.setHours(endDate.getHours());
    updatedEndDate.setMinutes(endDate.getMinutes());

    if (updatedEndDate <= startDate) {
      updatedEndDate.setTime(startDate.getTime() + 15 * 60 * 1000);
      Alert.alert(
        "Invalid End Date",
        "The end date must be after the start date."
      );
    }

    setEndDate(updatedEndDate);
    setEndDatePickerVisible(false);
  };

  const handleStartTimeConfirm = (time) => {
    const updatedStartDate = new Date(startDate);
    updatedStartDate.setHours(time.getHours());
    updatedStartDate.setMinutes(time.getMinutes());

    const updatedEndDate = new Date(endDate);

    if (updatedEndDate <= updatedStartDate) {
      updatedEndDate.setTime(updatedStartDate.getTime() + 15 * 60 * 1000); // Add 15 minutes
      setEndDate(updatedEndDate);
    }

    setStartDate(updatedStartDate);
    setStartTimePickerVisible(false);
  };

  const handleEndTimeConfirm = (time) => {
    const updatedEndDate = new Date(endDate);
    updatedEndDate.setHours(time.getHours());
    updatedEndDate.setMinutes(time.getMinutes());

    if (updatedEndDate <= startDate) {
      Alert.alert("Invalid Time", "The end time must be after the start time.");
    } else {
      setEndDate(updatedEndDate);
    }

    setEndTimePickerVisible(false);
  };

  const validateEventTiming = (startDate, endDate) => {
    if (endDate <= startDate) {
      setInvalidMessage({
        message: "The end time must be after the start time.",
        stop: true,
      });
      return false;
    }

    setInvalidMessage(null); // Clear any previous error
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerButton} onPress={handleLeaveScreen}>
          Cancel
        </Text>
        <Text style={styles.headerButton} onPress={handleAddEvent}>
          Add
        </Text>
      </View>

      <ScrollView>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Event Title"
            value={eventTitle}
            onChangeText={setEventTitle}
            placeholderTextColor="#333"
          />
          <TextInput
            style={styles.input}
            placeholder="Event Description"
            value={eventDescription}
            onChangeText={setEventDescription}
            placeholderTextColor="#333"
          />

          <View style={styles.dateTimeContainer}>
            {/* Start Date and Time */}
            <View style={styles.row}>
              <Text style={styles.label}>Start:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setStartDatePickerVisible(true)}
              >
                <Text style={styles.dateButtonText}>
                  {startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setStartTimePickerVisible(true)}
              >
                <Text style={styles.dateButtonText}>
                  {startDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* End Date and Time */}
            <View style={styles.row}>
              <Text style={styles.label}>End:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setEndDatePickerVisible(true)}
              >
                <Text style={styles.dateButtonText}>
                  {endDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setEndTimePickerVisible(true)}
              >
                <Text style={styles.dateButtonText}>
                  {endDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.locationContainer}>
            <TouchableOpacity
              style={styles.locationBox}
              onPress={() =>
                navigation.navigate("SetLocation", { calendarId, shared })
              }
            >
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Add Location:</Text>
                <Text
                  style={styles.locationText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {location
                    ? `Latitude ${location.latitude}, Longitude ${location.longitude}`
                    : `Location not set`}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Start Date Picker Modal */}
        <DateTimePickerModal
          isVisible={isStartDatePickerVisible}
          mode="date"
          onConfirm={handleStartDateConfirm}
          onCancel={() => setStartDatePickerVisible(false)}
        />

        {/* Start Time Picker Modal */}
        <DateTimePickerModal
          isVisible={isStartTimePickerVisible}
          mode="time"
          onConfirm={handleStartTimeConfirm}
          onCancel={() => setStartTimePickerVisible(false)}
        />

        {/* End Date Picker Modal */}
        <DateTimePickerModal
          isVisible={isEndDatePickerVisible}
          mode="date"
          onConfirm={handleEndDateConfirm}
          onCancel={() => setEndDatePickerVisible(false)}
        />

        {/* End Time Picker Modal */}
        <DateTimePickerModal
          isVisible={isEndTimePickerVisible}
          mode="time"
          onConfirm={handleEndTimeConfirm}
          onCancel={() => setEndTimePickerVisible(false)}
        />

        <TouchableOpacity onPress={() => setShowTimetable((prev) => !prev)}>
          <Text style={styles.toggleText}>
            {showTimetable
              ? "Hide available time slots"
              : "Show available time slots"}
          </Text>
        </TouchableOpacity>
        {showTimetable && (
          <Timetable
            calendarId={calendarId}
            onTimeChange={handleTimeChange}
            startDate={startDate}
            endDate={endDate}
            setInvalidMessage={setInvalidMessage}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    // padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  headerButton: {
    fontSize: 18,
    color: "#007bff",
  },
  toggleText: {
    fontSize: 16,
    color: "#007bff",
    textAlign: "center",
    marginVertical: 10,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  input: {
    width: "100%",
    alignSelf: "center",

    // inside padding
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  dateTimeContainer: {
    marginVertical: 10,
    paddingTop: 15,
    paddingBottom: 5, // for even padding bottom needs to be -10
    paddingHorizontal: 12,
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 4,
    marginRight: 8,
    width: 50,
    textAlign: "left",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: "#aaa",
    alignItems: "center",
  },
  dateButtonText: {
    color: "#000",
    fontSize: 16,
  },

  locationText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "bold",
  },

  locationContainer: {
    marginVertical: 10,
  },

  locationBox: {
    backgroundColor: "#e6e6e6", // Grey background
    padding: 15, // Padding for the grey box
    borderRadius: 10, // Rounded corners
    flexDirection: "row", // Align items in a row
    alignItems: "center", // Center vertically
  },

  locationContent: {
    flexDirection: "row", // Row layout for label and text
    alignItems: "center", // Align text and label vertically
    flex: 1, // Ensure content stretches as needed
  },

  locationLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8, // Spacing between the label and the text
  },

  locationText: {
    fontSize: 14,
    color: "#000",
    flex: 1, // Allow the text to take available space
    overflow: "hidden", // Ensure proper truncation behavior
  },
});
