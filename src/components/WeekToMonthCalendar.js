import React, { useState, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  Text,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const rowHeight = 50; // Height of a single week row
const dragBarHeight = 20; // Fixed height for the drag bar

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
  const today = new Date();
  //const today = new Date(2026, 1, 15); // FOR TESTING - Uncomment to test

  // States
  const [currentDate, setCurrentDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  const [selectedDay, setSelectedDay] = useState(today); // Initialize to today
  const [totalRows, setTotalRows] = useState(6); // Default rows, updated dynamically
  const [currentWeek, setCurrentWeek] = useState(() => {
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return Math.ceil((today.getDate() + firstDayOfMonth.getDay()) / 7);
  });

  const daysOfWeek = orderDaysOfWeek();

  // Dynamically calculate MONTH_HEIGHT based on totalRows
  const WEEK_HEIGHT = rowHeight;
  const MONTH_HEIGHT = totalRows * rowHeight;

  // Shared values for animated height and offset
  const translateY = useSharedValue(WEEK_HEIGHT); // Starts at week view height
  const topOffset = useSharedValue(-(currentWeek - 1) * WEEK_HEIGHT); // Offset for rows above current week

  useEffect(() => {
    // Update total rows dynamically based on the month
    const { totalRows: newTotalRows } = getCalendarRows(
      currentDate.year,
      currentDate.month
    );
    setTotalRows(newTotalRows);

    if (translateY.value > WEEK_HEIGHT) {
      translateY.value = withSpring(newTotalRows * rowHeight); // Use new MONTH_HEIGHT here
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
        translateY.value = withSpring(MONTH_HEIGHT); // Switch to month view
        topOffset.value = withSpring(0);
      } else {
        translateY.value = withSpring(WEEK_HEIGHT); // Switch to week view
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
        translateY.value = withSpring(MONTH_HEIGHT); // Switch to month view
        topOffset.value = withSpring(0);
      } else {
        translateY.value = withSpring(WEEK_HEIGHT); // Switch to week view
        topOffset.value = withSpring(-(currentWeek - 1) * WEEK_HEIGHT);
      }
    });

  // Animated styles
  const animatedHeightStyle = useAnimatedStyle(() => ({
    height: translateY.value,
  }));

  const animatedOffsetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: topOffset.value }],
  }));

  // Helper function to generate calendar rows
  function getCalendarRows(year, month) {
    const START_DAY = 0;

    // Calculate the first day of the month
    const firstDayOfMonth = new Date(year, month - 1, 1); // Month is 0-indexed in Date()
    const startPushBack = (firstDayOfMonth.getDay() - START_DAY + 7) % 7;

    // Calculate the number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();

    const rows = [];
    let currentDay = 1;

    // Calculate the maximum number of rows dynamically
    const totalCells = startPushBack + daysInMonth;
    const maxRows = Math.ceil(totalCells / 7);

    for (let row = 0; row < maxRows; row++) {
      const days = [];

      for (let day = 0; day < 7; day++) {
        if (row === 0 && day < startPushBack) {
          days.push(''); // Blank days before the month starts
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
        onDateChange(selectedDate); // Notify parent
      }
    }
  };

  const handleMonthClick = () => {
    setCurrentDate((prev) => {
      const nextMonth = prev.month === 12 ? 1 : prev.month + 1;
      const nextYear = prev.month === 12 ? prev.year + 1 : prev.year;

      // Update currentDate
      const newDate = { year: nextYear, month: nextMonth };

      // Reset week view to row 1 and select the first day of the new month
      const firstDayOfMonth = new Date(newDate.year, newDate.month - 1, 1); // First day of the new month
      setSelectedDay(firstDayOfMonth); // Select the first day
      setCurrentWeek(1); // Reset to week 1
      return newDate;
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, styles.safeArea]}>
        {/* Month and Days of the Week at the Top */}
        <View style={styles.viewIndicator}>
          <TouchableOpacity onPress={handleMonthClick} activeOpacity={0.7}>
            <Text style={styles.viewIndicatorText}>
              {getMonthName(currentDate.month)}
            </Text>
          </TouchableOpacity>
        </View>
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
          </View>
        </GestureDetector>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  safeArea: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  viewIndicator: {
    padding: 10,
    backgroundColor: '#007bff',
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  viewIndicatorText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginHorizontal: 2,
    backgroundColor: '#e3f2fd',
    paddingVertical: 5,
  },
  dayOfWeek: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: 'bold',
  },
  calendar: {
    width: '100%',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: rowHeight,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  dayContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  dayText: { fontSize: 16 },
  selectedDay: { backgroundColor: '#007bff' },
  selectedDayText: { color: '#fff' },
  today: { backgroundColor: '#d3d3d3' },
  todayText: { color: '#000' },
  dragBar: {
    height: dragBarHeight,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,

    // iOS dropshadow
    shadowColor: '#ddd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,

    // Android dropshadow
    elevation: 6,
  },
  dragBarIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#bbb',
    borderRadius: 2,
  },
});

export default WeekToMonthCalendar;
