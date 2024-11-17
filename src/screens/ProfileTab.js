import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileScreen from "./ProfileScreen.js";
import AddFriendsScreen from "./AddFriendsScreen.js";

const Stack = createStackNavigator();

export default function ProfileTab({ navigation }) {
  return (
    <Stack.Navigator initialRouteName="ProfileScreen">
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FriendsScreen"
        component={AddFriendsScreen}
      />
    </Stack.Navigator>
  );
}