import React, { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { auth } from "../../firebaseConfig";
import Geocoder from "react-native-geocoding";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import { GOOGLE_MAPS_API_KEY } from "../../config";

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

  // Perform a search for a location based on user input
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

      // Animate the map to the searched location
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

  // Request location permissions and get the user's current location
  useEffect(() => {
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

  // Handle setting the selected location
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

  // Handle map press to set a new location
  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  // Display appropriate location text
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
        <View style={styles.buttonView}>
          <Button title="Search" onPress={performSearch} />
        </View>
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
  provider={Platform.OS === "android" ? PROVIDER_GOOGLE : null} // Use Apple Maps on iOS
  onPress={handleMapPress}
/>


      <Button title="Set Location" onPress={handleSetLocation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "black",
    padding: 5,
    borderRadius: 5,
    margin: 10,
  },
  paragraph: {
    fontWeight: "bold",
    fontSize: 14,
  },
  map: {
    width: "100%",
    height: "70%",
  },
  searchRow: {
    flexDirection: "row",
  },
  buttonView: {
    margin: 10,
  },
});
