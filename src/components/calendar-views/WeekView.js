import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, Text, StyleSheet, View, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';

// Function to generate calendar days
const generateDates = (year, startDayOfWeek) => {
  const startDate = new Date(year, 0, 1);
  const currentDay = startDate.getDay();
  const adjustment = (currentDay + 7 - startDayOfWeek) % 7;
  const firstStartDay = new Date(startDate.setDate(startDate.getDate() - adjustment));
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

const WeekView = ({ onDateSelect }) => {
  const year = 2024; // Desired year
  const startDayOfWeek = 0; // Start the week on Sunday
  const calendarDays = generateDates(year, startDayOfWeek);

  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const todayIndex = calendarDays.indexOf(todayDate);

  // Find the start of the current week (ensure it doesn't go negative)
  const startOfWeekIndex = Math.max(0, todayIndex - (today.getDay() - startDayOfWeek));

  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);
  const scrollViewRef = useRef(null);

  // Scroll to the current week when the component mounts
  useEffect(() => {
    if (scrollViewRef.current) {
      const itemWidth = Dimensions.get('window').width / 7; // Width of each day container
      scrollViewRef.current.scrollTo({ x: startOfWeekIndex * itemWidth, animated: true });
    }
  }, [startOfWeekIndex]);

  // Function to get styles for selected day and today's highlight
  const getSelectedDayStyle = (index) => {
    if (index === selectedDayIndex) return styles.selectedDay; // Blue for selected day
    if (index === todayIndex) return styles.currentDayInactive; // Grey for today when not selected
    return null;
  };

  const logSelectedDate = (index) => {
    const selectedDay = calendarDays[index];
    const date = new Date(year, todayMonth, selectedDay);
    onDateSelect(date); // Notify parent
  };

  return (
    <SafeAreaView>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.weekGrid}
      >
        {calendarDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.weekContainer, getSelectedDayStyle(index)]}
            onPress={() => {
              setSelectedDayIndex(index);
              logSelectedDate(index);
            }}
          >
            <Text
              style={[
                styles.dayText,
                index === selectedDayIndex ? styles.selectedDayText : null,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  weekGrid: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 10,
  },
  weekContainer: {
    width: Dimensions.get('window').width / 7, // Exact width for 7 days
    aspectRatio: 1, // height:40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  dayText: { fontSize: 16, color: 'black' },
  selectedDay: { backgroundColor: '#007bff' },
  selectedDayText: { color: 'white' },
  currentDayInactive: { backgroundColor: '#d3d3d3' },
});

export default WeekView;
