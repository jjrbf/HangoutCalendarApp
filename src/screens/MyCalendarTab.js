import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import MyCalendarScreen from "./MyCalendarTab/MyCalendarScreen.js";
import AddEventScreen from "./EventRelated/AddEventScreen.js";
import SetLocationScreen from "./EventRelated/SetLocationScreen.js";
import EventDetailsScreen from "./EventRelated/EventDetailsScreen.js";

const Stack = createStackNavigator();

export default function MyCalendarTab({ navigation }) {
  return (
    <Stack.Navigator initialRouteName="MyCalendarScreen">
      <Stack.Screen
        name="MyCalendarScreen"
        component={MyCalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen
        name="AddEvent"
        component={AddEventScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="SetLocation" component={SetLocationScreen} />
    </Stack.Navigator>
  );
}
