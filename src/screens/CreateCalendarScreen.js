import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  query,
  where
} from "firebase/firestore";

export default function CreateCalendarScreen({ navigation }) {
  const userId = auth.currentUser.uid;

  const [calendarName, setCalendarName] = useState("");
  const [members, setMembers] = useState([]);
  const [friends, setFriends] = useState([]);

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Fetch friends details
          const friendUids = userData.friends || [];
          const friendPromises = friendUids.map((friendUid) =>
            getDoc(doc(db, "users", friendUid))
          );
          const friendDocs = await Promise.all(friendPromises);

          const friendList = friendDocs
            .filter((doc) => doc.exists())
            .map((doc) => ({
              id: doc.id,
              name: doc.data().name,
              username: doc.data().username,
            }));

          setFriends(friendList);
        } else {
          console.error("No such user document!");
        }
      } catch (error) {
        console.error("Error fetching friend data: ", error);
      }
    };

    fetchUserData();
  }, [userId]); // might have to change when it updates

  const handleCalendarCreation = async () => {
    if (!calendarName || members.length === 0) {
      Alert.alert("Creation Error", "Please fill out all fields.");
      return;
    }

    try {
      const calendarsCollection = collection(db, "calendars");

      // Check if calendar already exists
      const querySnapshot = await getDocs(
        query(
          calendarsCollection,
          where("ownerId", "==", userId),
          where("name", "==", calendarName)
        )
      );

      if (!querySnapshot.empty) {
        Alert.alert(
          "Calendar Exists",
          "You already have a calendar with this name. Please choose a different name."
        );
        return;
      }

      // Automatically generate unique ID
      await addDoc(calendarsCollection, {
        ownerId: userId,
        name: calendarName,
        members: members,
        createdAt: new Date(),
      });

      Alert.alert(
        "Calendar Created!",
        "Your shared calendar has been created."
      );
      navigation.navigate("SharedCalendar");
    } catch (error) {
      console.error("Create Calendar Error:", error);
      Alert.alert("Calendar Creation Failed", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Button
        title="Back to Screen"
        onPress={() => navigation.navigate("SharedCalendar")}
      />
      <View>
        <TextInput
          style={styles.input}
          placeholder="Calendar Name"
          value={calendarName}
          onChangeText={setCalendarName}
        />

        <Text>Friends:</Text>
        {friends.length > 0 ? (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.friendItem}>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{item.name}</Text>
                  <Text style={styles.friendUsername}>@{item.username}</Text>
                </View>
                <TouchableOpacity
                  style={
                    members.includes(item.id)
                      ? styles.removeButton
                      : styles.addButton
                  }
                  onPress={() => {
                    if (members.includes(item.id)) {
                      // Remove friend from members
                      setMembers((prevMembers) =>
                        prevMembers.filter((memberId) => memberId !== item.id)
                      );
                    } else {
                      // Add friend to members
                      setMembers((prevMembers) => [...prevMembers, item.id]);
                    }
                  }}
                >
                  <Text
                    style={
                      members.includes(item.id)
                        ? styles.removeButtonText
                        : styles.addButtonText
                    }
                  >
                    {members.includes(item.id) ? "Remove" : "Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noFriendsText}>
            No friends added yet. Add one in the profile tab to add friends to
            your shared calendar!
          </Text>
        )}

        <Button title="Create Calendar" onPress={handleCalendarCreation} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    width: "100%",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  friendUsername: {
    fontSize: 14,
    color: "#555",
  },
  addButton: {
    backgroundColor: "#4CAF50", // Green
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  removeButton: {
    backgroundColor: "#F44336", // Red
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  removeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  noFriendsText: {
    marginVertical: 10,
    fontSize: 16,
    color: "#555",
  },
});
