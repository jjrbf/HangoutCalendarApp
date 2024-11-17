import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MyCalendarTab from "./MyCalendarTab.js";
import SharedCalendarsTab from "./SharedCalendarsTab.js";
import ProfileTab from "./ProfileTab.js";

const Tab = createBottomTabNavigator();

export default function ProtectedLayout() {
  return (
    <Tab.Navigator initialRouteName="My Calendar">
      <Tab.Screen
        name="Shared Calendars"
        component={SharedCalendarsTab}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="My Calendar"
        component={MyCalendarTab}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Me"
        component={ProfileTab}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
