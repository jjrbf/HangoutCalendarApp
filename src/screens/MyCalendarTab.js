import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import MyCalendarScreen from "./MyCalendarScreen.js";
import AddEventScreen from "./AddEventScreen.js";

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
        name="AddEvent"
        component={AddEventScreen}
      />
    </Stack.Navigator>
  );
}