import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MyCalendarTab from "./MyCalendarTab.js";
import SharedCalendarScreen from "./SharedCalendarScreen.js";
import ProfileScreen from "./ProfileScreen.js";

const Tab = createBottomTabNavigator();

export default function ProtectedLayout() {
  return (
    <Tab.Navigator initialRouteName="My Calendar">
      <Tab.Screen
        name="Shared Calendars"
        component={SharedCalendarScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="My Calendar"
        component={MyCalendarTab}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Me"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
