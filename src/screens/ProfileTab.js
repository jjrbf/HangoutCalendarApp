import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileScreen from "./ProfileTab/ProfileScreen.js";
import AddFriendsScreen from "./ProfileTab/AddFriendsScreen.js";

const Stack = createStackNavigator();

export default function ProfileTab({ navigation }) {
  return (
    <Stack.Navigator initialRouteName="ProfileScreen">
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="FriendsScreen" component={AddFriendsScreen} />
    </Stack.Navigator>
  );
}
