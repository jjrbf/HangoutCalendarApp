import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { db, auth } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { ProfilePicture } from "../../components";
import MapView, { Marker } from "react-native-maps";
import { GEONAMES_USERNAME } from "../../config.js";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function EventDetailsScreen({ route, navigation }) {
  const { eventId, shared, calendarId } = route.params;
  const [calendar, setCalendar] = useState(null);
  const [owner, setOwner] = useState(null);
  const [members, setMembers] = useState([]);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        if (shared) {
          const calendarDoc = doc(db, "calendars", calendarId);
          const calendarSnapshot = await getDoc(calendarDoc);
          if (calendarSnapshot.exists()) {
            const calendarData = calendarSnapshot.data();
            setCalendar({
              ...calendarData,
              id: calendarSnapshot.id,
            });

            const ownerRef = doc(db, "users", calendarData.ownerId);
            const ownerDoc = await getDoc(ownerRef);
            if (ownerDoc.exists()) {
              setOwner({ id: calendarData.ownerId, ...ownerDoc.data() });
            }

            const memberDetails = await Promise.all(
              calendarData.members.map(async (memberId) => {
                const memberRef = doc(db, "users", memberId);
                const memberDoc = await getDoc(memberRef);
                return memberDoc.exists() ? { id: memberId, ...memberDoc.data() } : null;
              })
            );
            setMembers(memberDetails.filter((member) => member));
          } else {
            setError("Calendar not found.");
          }
        }

        const eventDoc = shared
          ? doc(db, "calendars", calendarId, "events", eventId)
          : doc(
              db,
              "calendars",
              `personal_calendar_${auth.currentUser.uid}`,
              "events",
              eventId
            );
        const eventSnapshot = await getDoc(eventDoc);
        if (eventSnapshot.exists()) {
          const eventData = eventSnapshot.data();
          setEvent({
            ...eventData,
            id: eventSnapshot.id,
          });
        } else {
          setError("Event not found.");
        }
      } catch (error) {
        console.error("Error fetching event details: ", error);
        setError("Error fetching event details.");
      }
    };

    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    if (event && event.location != null) {
      const fetchWeather = async () => {
        try {
          const latitude = event.location?.latitude ?? 49.19;
          const longitude = event.location?.longitude ?? -123.17;
          const response = await fetch(
            `http://api.geonames.org/findNearByWeatherJSON?lat=${latitude}&lng=${longitude}&username=${GEONAMES_USERNAME}`
          );
          const data = await response.json();

          if (response.ok) {
            setWeather(data.weatherObservation);
          } else {
            setError("Failed to fetch weather");
          }
        } catch (err) {
          setError(err.message || "Failed to fetch weather");
        }
      };

      fetchWeather();
    }
  }, [event]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Event Details",
      headerTitleStyle: { fontSize: 24, fontWeight: "bold" },
      headerTitleAlign: "center",
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

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

  return (
  <View style={styles.container}>
    <ScrollView>
      <View style={styles.detailsContainer}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDescription}>
          {event.description ? event.description : "No description available."}
        </Text>
        <View style={styles.eventDetailBox}>
          <Text style={styles.eventDetailTitle}>Event Time:</Text>
          <Text style={styles.eventDetail}>
            {`Start: ${event.startDate.toDate().toLocaleString()}`}
          </Text>
          <Text style={styles.eventDetail}>
            {`End: ${event.endDate.toDate().toLocaleString()}`}
          </Text>
        </View>
      </View>

      {shared && (
        <View style={styles.sharedDetailsBox}>
          {/* Calendar Name */}
          <Text style={styles.sharedCalendarName}>Calendar: {calendar?.name}</Text>

          {/* Members List */}
          <Text style={styles.sectionTitle}>Members:</Text>
          <View style={styles.membersContainer}>
            {owner && (
              <View style={[styles.memberItem, styles.ownerItem]}>
                <ProfilePicture userId={owner.id} size={50} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{owner.name} (Owner)</Text>
                  <Text style={styles.memberUsername}>@{owner.username}</Text>
                </View>
              </View>
            )}
            {members
              .filter((member) => member.id !== calendar?.ownerId)
              .map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <ProfilePicture userId={member.id} size={50} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberUsername}>@{member.username}</Text>
                  </View>
                </View>
              ))}
          </View>
        </View>
      )}

      <View style={styles.eventLocationBox}>
        {event.location && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: event.location.latitude,
              longitude: event.location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{
                latitude: event.location.latitude,
                longitude: event.location.longitude,
              }}
            />
          </MapView>
        )}
        {weather && (
          <View style={styles.weatherDetails}>
            <Text style={styles.locationText}>
              {/* Location: {weather.stationName || "Unavailable"} */}
              Weather:
            </Text>
            <Text style={styles.tempText}>
              Temperature: {weather.temperature || "N/A"}°C
            </Text>
            <Text style={styles.descText}>
              Humidity: {weather.humidity || "N/A"}%
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loading: {
    flex: 1,
    justifyItems: "center",
    alignItems: "center",
    fontWeight: "bold",
    marginTop: 16
  },
  backButton: {
    marginLeft: 16,
  },
  detailsContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
    color: "#333",
  },
  eventDescription: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 20,
    color: "#555",
  },
  eventDetailBox: {
    backgroundColor: "#eee",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventDetailTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  eventDetail: {
    fontSize: 16,
    marginBottom: 4,
    color: "#777",
  },
  sharedDetailsBox: {
    backgroundColor: "#eee",
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sharedCalendarName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#555",
  },
  membersContainer: {
    marginTop: 8,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
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
  eventLocationBox: {
    backgroundColor: "#eee",
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  weatherDetails: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    marginTop: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  tempText: {
    fontSize: 16,
    color: "#555",
  },
  descText: {
    fontSize: 15,
    color: "#777",
  },
});

