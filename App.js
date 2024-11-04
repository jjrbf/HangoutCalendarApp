import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MonthView from "./src/screens/MonthView.js";
import WeekView from "./src/screens/WeekView.js";
import { SafeAreaView } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

const orderDaysOfWeek = (startDayOfWeek) => {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  return [...days.slice(startDayOfWeek), ...days.slice(0, startDayOfWeek)];
};

const CalendarSwitcher = () => {
  const [isMonthView, setIsMonthView] = React.useState(true);
  const startDayOfWeek = 0; // Start the week on Sunday

  return (
    <View>
      {/* Switch button */}
      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsMonthView(!isMonthView)}
      >
        <Text style={styles.switchButtonText}>
          Switch to {isMonthView ? "Week View" : "Month View"}
        </Text>
      </TouchableOpacity>

      {/* Days of the Week */}
      <View style={styles.daysOfWeek}>
        {orderDaysOfWeek(startDayOfWeek).map((day, index) => (
          <Text key={index} style={styles.dayOfWeekText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Render the appropriate view based on state */}
      {isMonthView ? <MonthView /> : <WeekView />}
    </View>
  );
};

const SharedCalendars = () => (
  <SafeAreaView style={styles.centeredContainer}>
    <Text>Recent</Text>
  </SafeAreaView>
);

const MyCalendar = () => (
  <SafeAreaView style={styles.centeredContainer}>
    <CalendarSwitcher />
  </SafeAreaView>
);

const Me = () => (
  <SafeAreaView style={styles.centeredContainer}></SafeAreaView>
);

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName="My Calendar">
        <Tab.Screen
          name="Shared Calendars"
          component={SharedCalendars}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="My Calendar"
          component={MyCalendar}
          options={{ headerShown: false }}
        />
        <Tab.Screen 
          name="Me"
          component={Me}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  switchButton: {
    padding: 10,
    backgroundColor: "#007bff",
    alignItems: "center",
  },
  switchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  daysOfWeek: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#e3f2fd",
    paddingVertical: 7,
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007bff",
    width: "13%",
    textAlign: "center",
  },
});

export default App;
