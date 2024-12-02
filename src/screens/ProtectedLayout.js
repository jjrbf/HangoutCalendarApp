import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
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
          fontWeight: '500',
          marginTop: 5,
        },
        tabBarIconStyle: {
          marginTop: 0, // prevent cutoff
        },
        tabBarStyle: {
          height: 90,
          paddingVertical: 10,
          // backgroundColor: "#e3e3e3", // Background color
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
