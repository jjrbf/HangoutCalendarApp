import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MonthView from "./calendar-views/MonthView.js";
import WeekView from "./calendar-views/WeekView.js";

const orderDaysOfWeek = (startDayOfWeek) => {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  return [...days.slice(startDayOfWeek), ...days.slice(0, startDayOfWeek)];
};

export default function CalendarSwitcher() {
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