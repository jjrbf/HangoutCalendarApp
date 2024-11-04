import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MyCalendarScreen, SharedCalendarScreen, ProfileScreen } from './src/screens';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName="My Calendar">
        <Tab.Screen
          name="Shared Calendars"
          component={SharedCalendarScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="My Calendar"
          component={MyCalendarScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen 
          name="Me"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
