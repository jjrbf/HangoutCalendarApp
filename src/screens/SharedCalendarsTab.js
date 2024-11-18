import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SharedCalendarScreen from "./SharedCalendarScreen.js";
import CalendarScreen from "./CalendarScreen.js";
import CreateCalendarScreen from "./CreateCalendarScreen.js";
import AddSharedEventScreen from "./AddSharedEventScreen.js";
import EventDetailsScreen from "./EventDetailsScreen.js";
import SetLocationSharedScreen from "./SetLocationSharedScreen.js";

const Stack = createStackNavigator();

export default function ProfileTab({ navigation }) {
  return (
    <Stack.Navigator initialRouteName="SharedCalendar">
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
      <Stack.Screen
        name="AddSharedEvent"
        component={AddSharedEventScreen}
      />
      <Stack.Screen
        name="SetLocationShared"
        component={SetLocationSharedScreen}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
      />
    </Stack.Navigator>
  );
  
        
}