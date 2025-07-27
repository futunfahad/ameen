import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import colors from "../config/colors";

// Screens
import HomeScreen from "../screens/HomeScreen";
import TranscriptionScreen from "../screens/TranscriptionScreen";
import CalendarScreen from "../screens/CalendarScreen";
import HistoryScreen from "../screens/HistoryScreen";
import CalanderButton from "./CalanderButton";

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#ccc" },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: "#999",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="calender"
        component={CalendarScreen}
        options={({ navigation, accessibilityState }) => ({
          tabBarButton: (props) => <CalanderButton {...props} />,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="microphone"
              color={color}
              size={size}
            />
          ),
        })}
      />

      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="sort-variant"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
