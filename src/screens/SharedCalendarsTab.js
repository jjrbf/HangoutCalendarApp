import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SharedCalendarScreen from "./SharedCalendarTab/SharedCalendarScreen.js";
import CalendarScreen from "./SharedCalendarTab/CalendarScreen.js";
import CreateCalendarScreen from "./SharedCalendarTab/CreateCalendarScreen.js";
import AddEventScreen from "./EventRelated/AddEventScreen.js";
import EventDetailsScreen from "./EventRelated/EventDetailsScreen.js";
import SetLocationScreen from "./EventRelated/SetLocationScreen.js";

const Stack = createStackNavigator();

export default function ProfileTab({ navigation }) {
  return (
    <Stack.Navigator initialRouteName="SharedCalendar">
      <Stack.Screen
        name="SharedCalendar"
        component={SharedCalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="CreateCalendar" component={CreateCalendarScreen} />
      <Stack.Screen
        name="AddEvent"
        component={AddEventScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="SetLocation" component={SetLocationScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
}
