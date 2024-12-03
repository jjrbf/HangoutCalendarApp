import React, { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  Platform,
  TouchableOpacity,
} from "react-native";
import { auth } from "../../firebaseConfig";
import Geocoder from "react-native-geocoding";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { GOOGLE_MAPS_API_KEY } from "../../config";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function SetLocationScreen({ route, navigation }) {
  const userId = auth.currentUser?.uid;
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { calendarId, shared } = route.params;

  // Initialize Geocoder with Google Maps API key
  Geocoder.init(GOOGLE_MAPS_API_KEY);

  const mapRef = useRef(null);

  useEffect(() => {
    // Set navigation header styling
    navigation.setOptions({
      headerTitle: "Set Location",
      headerTitleStyle: { fontSize: 24, fontWeight: "bold" },
      headerTitleAlign: "center",
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
      ),
    });

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        setSelectedLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch (error) {
        console.error("Location error:", error);
        setErrorMsg("Failed to obtain current location.");
      }
    })();
  }, []);

  const performSearch = async () => {
    if (!searchLocation.trim()) {
      Alert.alert("Error", "Please enter a valid location.");
      return;
    }
    try {
      const json = await Geocoder.from(searchLocation);
      const locationData = json.results[0].geometry.location;
      const searchedLocation = {
        latitude: locationData.lat,
        longitude: locationData.lng,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

      mapRef.current?.animateCamera(
        { center: searchedLocation, zoom: 15 },
        { duration: 2000 }
      );

      setSelectedLocation({
        latitude: locationData.lat,
        longitude: locationData.lng,
      });
    } catch (error) {
      console.error("Geocoding error:", error);
      Alert.alert("Error", "Location not found. Please try again.");
    }
  };

  const handleSetLocation = () => {
    if (selectedLocation) {
      console.log("Setting location:", selectedLocation);
      navigation.navigate("AddEvent", {
        selectedLocation,
        calendarId,
        shared,
      });
    } else {
      Alert.alert("Error", "Please select a location first.");
    }
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  let locationText = "Waiting..";
  if (errorMsg) {
    locationText = errorMsg;
  } else if (selectedLocation) {
    locationText = `Selected location: latitude: ${selectedLocation.latitude}, longitude: ${selectedLocation.longitude}`;
  } else if (location) {
    locationText = `Current location: latitude: ${location.coords.latitude}, longitude: ${location.coords.longitude}`;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.paragraph}>{locationText}</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          onChangeText={setSearchLocation}
          value={searchLocation}
          placeholder="Enter location - name or address"
        />
        <TouchableOpacity style={styles.searchButton} onPress={performSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <MapView
        style={styles.map}
        ref={mapRef}
        initialRegion={{
          latitude: selectedLocation?.latitude || location?.coords?.latitude || 37.78825,
          longitude: selectedLocation?.longitude || location?.coords?.longitude || -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsMyLocationButton
        showsUserLocation
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : null}
        onPress={handleMapPress}
      />

      <TouchableOpacity
        style={styles.setLocationButton}
        onPress={handleSetLocation}
      >
        <Text style={styles.setLocationButtonText}>Set Location</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  backButton: {
    marginLeft: 16,
  },
  paragraph: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginVertical: 16,
  },
  searchRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  searchButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  map: {
    flex: 1,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  setLocationButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  setLocationButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
