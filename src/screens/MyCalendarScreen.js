import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarSwitcher } from "../components";

export default function MyCalendarScreen() {
  return (
    <SafeAreaView>
      <CalendarSwitcher />
    </SafeAreaView>
  );
}
