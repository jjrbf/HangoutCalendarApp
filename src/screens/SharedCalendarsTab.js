import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SharedCalendarScreen from "./SharedCalendarScreen.js";
import CalendarScreen from "./CalendarScreen.js";
import CreateCalendarScreen from "./CreateCalendarScreen.js";

const Stack = createStackNavigator();

export default function ProfileTab({ navigation }) {
  return (
    <Stack.Navigator initialRouteName="SharedCalendarScreen">
      <Stack.Screen
        name="SharedCalendar"
        component={SharedCalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
      />
      <Stack.Screen
        name="CreateCalendar"
        component={CreateCalendarScreen}
      />
    </Stack.Navigator>
  );
}