import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import MyCalendarScreen from "./MyCalendarScreen.js";
import AddEventScreen from "./AddEventScreen.js";
import SetLocationScreen from "./SetLocationScreen.js";
import EventDetailsScreen from "./EventDetailsScreen.js";

const Stack = createStackNavigator();

export default function MyCalendarTab({ navigation }) {
  return (
    <Stack.Navigator initialRouteName="MyCalendarScreen">
      <Stack.Screen
        name="MyCalendarScreen"
        component={MyCalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
      />
      <Stack.Screen
        name="AddEvent"
        component={AddEventScreen}
      />
      <Stack.Screen
        name="SetLocation"
        component={SetLocationScreen}
      />
    </Stack.Navigator>
  );
}