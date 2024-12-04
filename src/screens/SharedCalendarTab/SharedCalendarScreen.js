import React, { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  FlatList,
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { auth, db } from "../../firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable } from "react-native";

export default function SharedCalendarScreen({ navigation }) {
  const [calendars, setCalendars] = useState([]);
  const [ownedCalendars, setOwnedCalendars] = useState([]);
  const [filter, setFilter] = useState("All Calendars");
  const [searchText, setSearchText] = useState("");
  const [isFilterMenuVisible, setIsFilterMenuVisible] = useState(false);

  const userId = auth.currentUser.uid;

  // Function to fetch the owner username to show it on the UI for each shared calendar
  const fetchOwnerUsername = async (ownerId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", ownerId));
      return userDoc.exists() ? userDoc.data().username : "Unknown";
    } catch (error) {
      console.error("Error fetching owner username:", error);
      return "Unknown";
    }
  };
  
  // Gets all the shared calendars
  const fetchSharedCalendars = async () => {
    try {
      const calendarsCollection = collection(db, "calendars");
  
      // Fetch shared calendars
      let q = query(
        calendarsCollection,
        where("members", "array-contains", userId)
      );
      let querySnapshot = await getDocs(q);
  
      let fetchedCalendars = await Promise.all(
        querySnapshot.docs
          .map(async (doc) => {
            const calendarData = doc.data();
            if (!calendarData) return null; // Skip if no data
            const ownerUsername =
              calendarData.ownerId === userId
                ? "You"
                : await fetchOwnerUsername(calendarData.ownerId);
  
            return {
              id: doc.id || "unknown_id", // Fallback ID
              ...calendarData,
              ownerUsername,
            };
          })
      );
  
      // Filter out invalid calendars
      fetchedCalendars = fetchedCalendars.filter(
        (calendar) => calendar && calendar.id && !calendar.id.startsWith("personal_calendar_")
      );
  
      setCalendars(fetchedCalendars);
  
      // Fetch owned calendars
      q = query(calendarsCollection, where("ownerId", "==", userId));
      querySnapshot = await getDocs(q);
  
      fetchedCalendars = querySnapshot.docs
        .map((doc) => {
          const calendarData = doc.data();
          if (!calendarData) return null; // Skip if no data
          return {
            id: doc.id || "unknown_id", // Fallback ID
            ...calendarData,
            ownerUsername: "You",
          };
        })
        .filter((calendar) => calendar && calendar.id && !calendar.id.startsWith("personal_calendar_"));
  
      setOwnedCalendars(fetchedCalendars);
    } catch (error) {
      console.error("Error fetching shared calendars:", error);
    }
  };  

  // Runs if the screen is in focus
  useFocusEffect(
    useCallback(() => {
      fetchSharedCalendars();
    }, [userId])
  );

  // Function to get the filtered calendars based on the filter
  const filteredCalendars = () => {
    let combinedCalendars = [];
    if (filter === "All Calendars") {
      combinedCalendars = [...ownedCalendars, ...calendars];
    } else if (filter === "Owned by You") {
      combinedCalendars = ownedCalendars;
    } else if (filter === "Shared with You") {
      combinedCalendars = calendars;
    }

    return combinedCalendars.filter((calendar) =>
      calendar.name.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  // Code to render the calendar for the FlatList below
  const renderCalendar = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        styles.calendarItem,
        pressed && styles.calendarItemPressed, // Highlight when pressed
      ]}
      onPress={() => navigation.navigate("Calendar", { calendarId: item.id })}
    >
      <View style={styles.calendarRow}>
        <Icon name="calendar-blank-multiple" size={28} color="#666" style={styles.calendarIcon} />
        <View>
          <Text style={styles.calendarName}>{item.name}</Text>
          <Text style={styles.calendarOwner}>
            Owner: {item.ownerId == userId ? item.ownerUsername : `@${item.ownerUsername}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
  

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shared Calendars</Text>
        <View style={styles.headerIcons}>
          {/* Filter Icon */}
          <Pressable
            onPress={() => setIsFilterMenuVisible(!isFilterMenuVisible)}
            style={styles.iconButton}
          >
            <Icon name="filter-variant" size={28} color="black" />
          </Pressable>
          {/* Add Icon */}
          <Pressable
            onPress={() => navigation.navigate("CreateCalendar")}
            style={styles.iconButton}
          >
            <Icon name="plus" size={28} color="black" />
          </Pressable>
        </View>
      </View>

      {/* Filter Dropdown */}
      {isFilterMenuVisible && (
        <TouchableWithoutFeedback
          onPress={() => setIsFilterMenuVisible(false)} // Close the menu when tapping outside
        >
          <View style={styles.dropdown}>
            {["All Calendars", "Owned by You", "Shared with You"].map(
              (filterOption) => (
                <Pressable
                  key={filterOption}
                  style={[
                    styles.dropdownItem,
                    filter === filterOption && styles.activeDropdownItem,
                  ]}
                  onPress={() => {
                    setFilter(filterOption); // Set the selected filter
                    setIsFilterMenuVisible(false); // Close the dropdown
                  }}
                >
                  <Text style={styles.dropdownText}>{filterOption}</Text>
                </Pressable>
              )
            )}
          </View>
        </TouchableWithoutFeedback>
      )}


      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Icon name="magnify" size={24} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search calendars"
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filtered List */}
      <FlatList
        data={filteredCalendars()}
        keyExtractor={(item) => item.id}
        renderItem={renderCalendar}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No calendars found.</Text>
        }
        contentContainerStyle={styles.flatListContent} // Add padding to FlatList content
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 16,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    marginHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#333",
  },
  dropdown: {
    position: "absolute",
    top: 120,
    right: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  activeDropdownItem: {
    backgroundColor: "#eee",
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  calendarItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    // borderWidth: 1,
    // marginBottom: 12,
  },
  calendarItemPressed: {
    backgroundColor: "#eee", // Highlight background color
  },
  calendarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  calendarIcon: {
    marginRight: 16,
  },
  calendarName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  calendarOwner: {
    fontSize: 16,
    color: "#666",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});
