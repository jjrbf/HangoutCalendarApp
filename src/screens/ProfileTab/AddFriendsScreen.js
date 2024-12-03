import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { db, auth } from "../../firebaseConfig";
import { ProfilePicture } from "../../components";
import {
  getDocs,
  getDoc,
  query,
  collection,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  doc,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function FriendsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState("Your Friends");
  const userId = auth.currentUser.uid;

  useEffect(() => {
    if (activeTab === "Your Friends") {
      fetchFriends();
    }

    navigation.setOptions({
      headerTitle: "Friends",
      headerTitleStyle: { fontSize: 24, fontWeight: "bold", color: "black" },
      headerTitleAlign: "center",
      headerBackTitleVisible: false,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16 }}>
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, activeTab]);

  const fetchFriends = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const friendUids = userData.friends || [];
        if (friendUids.length === 0) {
          setFriends([]);
          return;
        }

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
      console.error("Error fetching friends:", error);
    }
  };

  const handleSearch = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", searchQuery));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("No Results", "No user found with that username.");
        setSearchResults([]);
      } else {
        const results = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Search Error:", error);
      Alert.alert("Error", "Could not search for users.");
    }
  };

  const handleAddFriend = async (friendId) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        friends: arrayUnion(friendId),
      });
      Alert.alert("Success", "Friend added successfully!");
    } catch (error) {
      console.error("Add Friend Error:", error);
      Alert.alert("Error", "Could not add friend.");
    }
  };

  const handleRemoveFriend = async (friendId) => {
    Alert.alert(
      "Remove Friend",
      "Are you sure you want to remove this friend?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "users", userId), {
                friends: arrayRemove(friendId),
              });
              setFriends((prevFriends) =>
                prevFriends.filter((friend) => friend.id !== friendId)
              );
              Alert.alert("Success", "Friend removed successfully.");
            } catch (error) {
              console.error("Error removing friend:", error);
              Alert.alert("Error", "Could not remove friend.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Your Friends" && styles.activeTab]}
          onPress={() => setActiveTab("Your Friends")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Your Friends" && styles.activeTabText,
            ]}
          >
            Your Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Add Friends" && styles.activeTab]}
          onPress={() => setActiveTab("Add Friends")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Add Friends" && styles.activeTabText,
            ]}
          >
            Add Friends
          </Text>
        </TouchableOpacity>
      </View>

      {/* Your Friends Tab */}
      {activeTab === "Your Friends" && (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <View style={styles.userDetails}>
                <ProfilePicture userId={item.id} size={50} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userUsername}>@{item.username}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFriend(item.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Add Friends Tab */}
      {activeTab === "Add Friends" && (
        <>
          <View style={styles.searchBarContainer}>
            <Icon
              name="magnify"
              size={24}
              color="#888"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchBar}
              placeholder="Search by username"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>

          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.userItem}>
                  <View style={styles.userDetails}>
                    <ProfilePicture userId={item.id} size={50} />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.name}</Text>
                      <Text style={styles.userUsername}>
                        @{item.username}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddFriend(item.id)}
                  >
                    <Text style={styles.addButtonText}>Add Friend</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </>
      )}
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
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 16,
    color: "#555",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "bold",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 10,
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
  searchButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 10,
    justifyContent: "space-between",

    // borderBottomWidth: 1,
    // borderBottomColor: "#ccc",
  },
  userDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 16,
    color: "#555",
  },
  removeButton: {
    backgroundColor: "#E63946",
    padding: 8,
    borderRadius: 5,
  },
  removeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#007BFF",
    padding: 8,
    borderRadius: 5,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  noFriendsText: {
    marginVertical: 10,
    fontSize: 16,
    color: "#555",
  },
});
