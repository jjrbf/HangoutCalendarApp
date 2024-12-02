import React, { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { db, auth } from "../../firebaseConfig";
import { ProfilePicture } from "../../components"; // Ensure this is imported
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function CreateCalendarScreen({ navigation }) {
  const userId = auth.currentUser.uid;

  const [calendarName, setCalendarName] = useState("");
  const [members, setMembers] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
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
              profilePicture: doc.data().profilePicture || null, // Assuming a profilePicture field exists
            }));
          setFriends(friendList);
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleCalendarCreation = async () => {
    if (!calendarName || members.length === 0) {
      Alert.alert("Creation Error", "Please fill out all fields.");
      return;
    }

    try {
      const calendarsCollection = collection(db, "calendars");
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

      await addDoc(calendarsCollection, {
        ownerId: userId,
        name: calendarName,
        members: members,
        createdAt: new Date(),
      });

      Alert.alert("Success", "Your calendar has been created!");
      navigation.navigate("SharedCalendar");
    } catch (error) {
      console.error("Error creating calendar:", error);
      Alert.alert("Error", "Could not create calendar.");
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Create Calendar",
      headerTitleStyle: { fontSize: 24, fontWeight: "bold", color: "black" },
      headerTitleAlign: "center",
      headerBackTitleVisible: false,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16 }}>
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Calendar Name Input */}
      <TextInput
        style={styles.input}
        placeholder="Calendar name"
        value={calendarName}
        onChangeText={setCalendarName}
        placeholderTextColor="#333"
      />

      {/* Friends List */}
      <Text style={styles.sectionTitle}>Add Friends:</Text>
      {friends.length > 0 ? (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.friendItem}>
              <View style={styles.friendDetails}>
                {/* Profile Picture */}
                <ProfilePicture userId={item.id} size={50} />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{item.name}</Text>
                  <Text style={styles.friendUsername}>@{item.username}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={
                  members.includes(item.id) ? styles.removeButton : styles.addButton
                }
                onPress={() => {
                  if (members.includes(item.id)) {
                    setMembers((prevMembers) =>
                      prevMembers.filter((memberId) => memberId !== item.id)
                    );
                  } else {
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
          No friends found. Add friends to include them in your calendar!
        </Text>
      )}

      {/* Create Calendar Button */}
      <TouchableOpacity style={styles.createButton} onPress={handleCalendarCreation}>
        <Text style={styles.createButtonText}>Create Calendar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  input: {
    width: "100%",
    alignSelf: "center",
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
  },
  friendDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendInfo: {
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  friendUsername: {
    fontSize: 14,
    color: "#666",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  removeButton: {
    backgroundColor: "#E63946",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  removeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  noFriendsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginVertical: 20,
  },
  createButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
