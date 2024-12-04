import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileScreen from "./ProfileTab/ProfileScreen.js";
import AddFriendsScreen from "./ProfileTab/AddFriendsScreen.js";
import SettingsScreen from "./ProfileTab/SettingsScreen.js";
import EditProfileScreen from "./ProfileTab/EditProfileScreen.js";

const Stack = createStackNavigator();

// Defines the navigation stack for the Profile tab
export default function ProfileTab({ navigation }) {
  return (
    <Stack.Navigator initialRouteName="Profile">
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="AddFriends" component={AddFriendsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}
