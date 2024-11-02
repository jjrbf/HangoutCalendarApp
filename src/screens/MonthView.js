import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  Dimensions
} from 'react-native';

// Function to generate calendar days
const generateDates = (year, startDayOfWeek) => {
  const startDate = new Date(year, 0, 1);
  const currentDay = startDate.getDay();
  const adjustment = (currentDay + 7 - startDayOfWeek) % 7;
  const firstStartDay = new Date(
    startDate.setDate(startDate.getDate() - adjustment)
  );
  const dates = [];

  for (let week = 0; week < 53; week++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(firstStartDay);
      date.setDate(firstStartDay.getDate() + week * 7 + day);
      dates.push(date.getDate());
    }
  }

  return dates;
};

const MonthView = () => {
  const year = 2024; // Desired year
  const startDayOfWeek = 0; // Start the week on Sunday
  const calendarDays = generateDates(year, startDayOfWeek);

  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const todayIndex = calendarDays.indexOf(todayDate);

  const [isMonthView, setIsMonthView] = useState(true);
  const itemHeight = 45; // Set item height here
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

  // Function to get styles for selected day and today's highlight
  const getSelectedDayStyle = (index) => {
    if (index === selectedDayIndex) return styles.selectedDay; // Blue for selected day
    if (index === todayIndex) return styles.currentDayInactive; // Grey for today when not selected
    return null;
  };

  // Log the selected date in 'year, month, day' format
  const logSelectedDate = (index) => {
    const selectedDay = calendarDays[index];
    const month = todayMonth + 1; // Months are zero-based
    console.log(`${year}, ${month}, ${selectedDay}`);
  };

  return (
    <SafeAreaView>
      <View style={{ height: itemHeight * 5 }}>
        <ScrollView
          contentContainerStyle={styles.monthGrid}
          showsVerticalScrollIndicator={false}>
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.monthContainer, getSelectedDayStyle(index)]}
              onPress={() => {
                setSelectedDayIndex(index);
                logSelectedDate(index); // Optional: Log selected date
              }}>
              <Text
                style={[
                  styles.dayText,
                  index === selectedDayIndex ? styles.selectedDayText : null,
                ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  monthContainer: {
    width: '13%',
    aspectRatio: 1, // height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    borderRadius: 20,
  },
  dayText: { fontSize: 16, color: 'black' },
  selectedDay: { backgroundColor: '#007bff', borderRadius: 20 },
  selectedDayText: { color: 'white' },
  currentDayInactive: { backgroundColor: '#d3d3d3', borderRadius: 20 },
});

export default MonthView;
