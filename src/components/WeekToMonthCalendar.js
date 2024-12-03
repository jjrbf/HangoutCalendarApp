import React, { useState, useEffect } from 'react';
import {
  View, SafeAreaView, StyleSheet, Text, TouchableOpacity,
} from 'react-native';
import {
  GestureHandlerRootView, Gesture, GestureDetector,
} from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { auth } from "../firebaseConfig";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const rowHeight = 50;
const dragBarHeight = 20;

// Blue Calendar Color Theme //
const lightDarkColor = '#fff';
const monthBar = '#007bff';
const weekBar = '#e3f2fd';
const weekBarText = '#007bff';
const todayUnselectedColor = '#d3d3d3';
const calendarColor = '#fff';

// Grey Calendar Color Theme //
// const monthBar = '#eee';
// const weekBar = '#eee';
// const weekBarText = '#464646';
// const lightDarkColor = '#000';
// const todayUnselectedColor = '#bbb';
// const calendarColor = '#eee';

const orderDaysOfWeek = (startDayOfWeek = 0) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return [...days.slice(startDayOfWeek), ...days.slice(0, startDayOfWeek)];
};

const getMonthName = (monthNumber) => {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return monthNames[monthNumber - 1];
};

const WeekToMonthCalendar = ({ onDateChange }) => {
  const isMonthView = useSharedValue(false);

  // const today = new Date();
  const today = new Date(2024, 10, 29); // FOR TESTING - Uncomment to test

  const navigation = useNavigation();

  const [currentDate, setCurrentDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  const [selectedDay, setSelectedDay] = useState(today);
  const [totalRows, setTotalRows] = useState(6);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return Math.ceil((today.getDate() + firstDayOfMonth.getDay()) / 7);
  });

  const daysOfWeek = orderDaysOfWeek();

  const WEEK_HEIGHT = rowHeight;
  const MONTH_HEIGHT = totalRows * rowHeight;

  const translateY = useSharedValue(WEEK_HEIGHT);
  const topOffset = useSharedValue(-(currentWeek - 1) * WEEK_HEIGHT);

  useEffect(() => {
    // Update total rows dynamically based on the month
    const { totalRows: newTotalRows } = getCalendarRows(
      currentDate.year,
      currentDate.month
    );
    setTotalRows(newTotalRows);

    if (translateY.value > WEEK_HEIGHT) {
      translateY.value = withSpring(newTotalRows * rowHeight);
      topOffset.value = withSpring(0);
    } else {
      topOffset.value = withSpring(-(currentWeek - 1) * WEEK_HEIGHT);
    }
  }, [currentDate, WEEK_HEIGHT, currentWeek, translateY, topOffset]);

  // Gesture for the calendar
  const calendarGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.min(
        Math.max(WEEK_HEIGHT, translateY.value + event.translationY),
        MONTH_HEIGHT
      );

      const totalVisibleRows = Math.round(translateY.value / WEEK_HEIGHT);
      const rowsBelow = totalRows - currentWeek;
      const rowsAbove = currentWeek - 1;

      if (totalVisibleRows > rowsBelow + 1) {
        const extraRows = totalVisibleRows - (rowsBelow + 1);
        topOffset.value = withSpring(
          -Math.max(0, rowsAbove - extraRows) * WEEK_HEIGHT,
          {
            damping: 15,
            stiffness: 100,
          }
        );
      } else {
        topOffset.value = -(currentWeek - 1) * WEEK_HEIGHT;
      }
    })
    .onEnd(() => {
      if (translateY.value > WEEK_HEIGHT + (MONTH_HEIGHT - WEEK_HEIGHT) / 2) {
        translateY.value = withSpring(MONTH_HEIGHT);
        topOffset.value = withSpring(0);
      } else {
        translateY.value = withSpring(WEEK_HEIGHT);
        topOffset.value = withSpring(-(currentWeek - 1) * WEEK_HEIGHT);
      }
    });

    

  // Gesture for the drag bar
  const dragBarGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.min(
        Math.max(WEEK_HEIGHT, translateY.value + event.translationY),
        MONTH_HEIGHT
      );

      const totalVisibleRows = Math.round(translateY.value / WEEK_HEIGHT);
      const rowsBelow = totalRows - currentWeek;
      const rowsAbove = currentWeek - 1;

      if (totalVisibleRows > rowsBelow + 1) {
        const extraRows = totalVisibleRows - (rowsBelow + 1);
        topOffset.value = withSpring(
          -Math.max(0, rowsAbove - extraRows) * WEEK_HEIGHT,
          {
            damping: 15,
            stiffness: 100,
          }
        );
      } else {
        topOffset.value = -(currentWeek - 1) * WEEK_HEIGHT;
      }
    })
    .onEnd(() => {
      if (translateY.value > WEEK_HEIGHT + (MONTH_HEIGHT - WEEK_HEIGHT) / 2) {
        translateY.value = withSpring(MONTH_HEIGHT);
        topOffset.value = withSpring(0);
      } else {
        translateY.value = withSpring(WEEK_HEIGHT);
        topOffset.value = withSpring(-(currentWeek - 1) * WEEK_HEIGHT);
      }
    });

  const animatedHeightStyle = useAnimatedStyle(() => ({
    height: translateY.value,
  }));

  const animatedOffsetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: topOffset.value }],
  }));

  // Helper function to generate calendar rows
  function getCalendarRows(year, month) {
    const START_DAY = 0;

    const firstDayOfMonth = new Date(year, month - 1, 1); // Month is 0-indexed in Date()
    const startPushBack = (firstDayOfMonth.getDay() - START_DAY + 7) % 7;

    const daysInMonth = new Date(year, month, 0).getDate();

    const rows = [];
    let currentDay = 1;

    const totalCells = startPushBack + daysInMonth;
    const maxRows = Math.ceil(totalCells / 7);

    for (let row = 0; row < maxRows; row++) {
      const days = [];

      for (let day = 0; day < 7; day++) {
        if (row === 0 && day < startPushBack) {
          days.push('');
        } else {
          days.push(currentDay <= daysInMonth ? currentDay : '');
          if (currentDay <= daysInMonth) currentDay++;
        }
      }

      rows.push(days);
    }

    return { rows, totalRows: rows.length };
  }

  const onDaySelect = (day) => {
    if (day) {
      const selectedDate = new Date(
        currentDate.year,
        currentDate.month - 1,
        day
      );
      setSelectedDay(selectedDate);
      if (onDateChange) {
        onDateChange(selectedDate);
      }
    }
  };

  const handleMonthClick = () => {
    setCurrentDate((prev) => {
      const nextMonth = prev.month === 12 ? 1 : prev.month + 1;
      const nextYear = prev.month === 12 ? prev.year + 1 : prev.year;
      const newDate = { year: nextYear, month: nextMonth };

      const firstDayOfMonth = new Date(newDate.year, newDate.month - 1, 1);
      setSelectedDay(firstDayOfMonth);
      setCurrentWeek(1);
      return newDate;
    });
  };

  const handleJumpToToday = () => {
    setCurrentDate({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    });
    setSelectedDay(today);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const weekOfToday = Math.ceil(
      (today.getDate() + firstDayOfMonth.getDay()) / 7
    );
    setCurrentWeek(weekOfToday);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, styles.safeArea]}>
        {/* Month and Days of the Week at the Top */}
        <View style={styles.header}>
          {/* Month Text */}
          <Text style={styles.monthText} onPress={handleMonthClick}>
            {getMonthName(currentDate.month)}
          </Text>

          {/* Header Buttons */}
          <View style={styles.headerButtons}>
            {/* Jump to Today Button */}
            <TouchableOpacity onPress={handleJumpToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>{today.getDate()}</Text>
            </TouchableOpacity>

            {/* Add Event Button */}
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AddEvent", {
                  calendarId: `personal_calendar_${auth.currentUser.uid}`,
                })
              }
              style={styles.addButton}
            >
              {/* REMEMBER TO CHANGE THIS COLOR TOO! */}
              <MaterialCommunityIcons name="plus" size={28} color="#fff" /> 
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Text */}
        <View style={styles.daysOfWeek}>
          {daysOfWeek.map((day, index) => (
            <Text key={index} style={styles.dayOfWeek}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar */}
        <GestureDetector gesture={calendarGesture}>
          <Animated.View style={[styles.calendar, animatedHeightStyle]}>
            <Animated.View style={animatedOffsetStyle}>
              {getCalendarRows(currentDate.year, currentDate.month).rows.map(
                (week, rowIndex) => (
                  <View key={rowIndex} style={styles.row}>
                    {week.map((day, dayIndex) => {
                      const isSelected =
                        selectedDay &&
                        selectedDay.getDate() === day &&
                        selectedDay.getMonth() + 1 === currentDate.month &&
                        selectedDay.getFullYear() === currentDate.year;

                      const isToday =
                        today.getDate() === day &&
                        today.getMonth() + 1 === currentDate.month &&
                        today.getFullYear() === currentDate.year;

                      return (
                        <TouchableOpacity
                        key={dayIndex}
                        onPress={() => onDaySelect(day)}
                        style={[
                            styles.dayContainer,
                            selectedDay &&
                            selectedDay.getDate() === day &&
                            selectedDay.getMonth() + 1 === currentDate.month &&
                            selectedDay.getFullYear() === currentDate.year
                            ? styles.selectedDay
                            : isToday
                            ? styles.today
                            : null,
                        ]}>
                        <Text
                            style={[
                            styles.dayText,
                            selectedDay &&
                            selectedDay.getDate() === day &&
                            selectedDay.getMonth() + 1 === currentDate.month &&
                            selectedDay.getFullYear() === currentDate.year
                                ? styles.selectedDayText
                                : isToday
                                ? styles.todayText
                                : null,
                            ]}>
                            {day || ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )
              )}
            </Animated.View>
          </Animated.View>
        </GestureDetector>

        {/* Drag Bar */}
        <GestureDetector gesture={dragBarGesture}>
          <View style={styles.dragBar}>
            <View style={styles.dragBarIndicator} />
            <View style={styles.dragBarBorder} />
          </View>
        </GestureDetector>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  viewIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#007bff',
  },
  viewIndicatorText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 20,
    paddingVertical: 12,
    backgroundColor: monthBar,
  },
  monthText: {
    fontSize: 28,
    fontWeight: "bold",
    color: lightDarkColor,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButton: {
    marginRight: 15,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  todayButton: {
    borderWidth: 2,
    borderColor: lightDarkColor,
    borderRadius: 2,
    paddingLeft: 1,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 28,
  },
  todayButtonText: {
    color: lightDarkColor,
    fontSize: 12,
    fontWeight: '800',
  },
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    backgroundColor: weekBar,
    paddingVertical: 5,
  },
  dayOfWeek: {
    fontSize: 16,
    color: weekBarText,
    fontWeight: 'bold',
  },
  calendar: {
    width: '100%',
    backgroundColor: calendarColor,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: rowHeight,
    paddingHorizontal: 8,
    backgroundColor: calendarColor,
  },
  dayContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  dayText: { fontSize: 16, fontWeight: '500', color: '#464646', },
  selectedDay: { backgroundColor: '#007bff' },
  selectedDayText: { color: '#fff' },
  today: { backgroundColor: todayUnselectedColor },
  todayText: { color: '#464646' },
  dragBar: {
    height: dragBarHeight,
    backgroundColor: calendarColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,

    // iOS dropshadow
    shadowColor: '#ddd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,

    // Android dropshadow
    elevation: 6,
  },
  dragBarBorder: {
    position: 'absolute',
    bottom: 0,
    height: 1,
    width: '100%', 
    backgroundColor: '#ccc',
  },
  dragBarIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#bbb',
    borderRadius: 2,
  },
});

export default WeekToMonthCalendar;
