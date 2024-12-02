import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Platform } from "react-native";
import MyCalendarTab from "./MyCalendarTab.js";
import SharedCalendarsTab from "./SharedCalendarsTab.js";
import ProfileTab from "./ProfileTab.js";

const Tab = createBottomTabNavigator();

export default function ProtectedLayout() {
  return (
    <Tab.Navigator
      initialRouteName="Your Calendar"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Shared Calendars") {
            iconName = "calendar-blank-multiple";
          } else if (route.name === "Your Calendar") {
            iconName = "calendar-blank";
          } else if (route.name === "Your Account") {
            iconName = "account-circle";
          }

          return <Icon name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "gray",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: Platform.OS === "ios" ? 0 : 5, // Move text higher on iOS
          marginBottom: Platform.OS === "ios" ? 12 : 0, // Add spacing below the text for iOS
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === "android" ? 5 : 0,
        },
        tabBarStyle: {
          height: Platform.OS === "android" ? 80 : 85,
          paddingBottom: Platform.OS === "android" ? 15 : 10,
          paddingTop: 5,
        },
      })}
    >
      <Tab.Screen
        name="Shared Calendars"
        component={SharedCalendarsTab}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Your Calendar"
        component={MyCalendarTab}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Your Account"
        component={ProfileTab}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
