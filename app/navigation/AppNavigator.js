import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import routes from "./routes";
import HomeScreen from "../screens/HomeScreen";

import NewListingButton from "./NewListingButton"; // make sure this is set up
import colors from "../config/colors";
import CalendarScreen from "../screens/CalendarScreen";
import AccountScreen from "../screens/AccountScreen";

const Tab = createBottomTabNavigator();

const AppNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: "#fff",
        borderTopColor: "#ccc",
      },
      tabBarActiveTintColor: colors.secondary, // ✅ Active icon color
      tabBarInactiveTintColor: "#999", // Optional inactive color
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
      name="calander"
      component={CalendarScreen}
      options={({ navigation }) => ({
        tabBarButton: (props) => (
          <NewListingButton
            onPress={() => navigation.navigate("calander")}
            active={props.accessibilityState?.selected} // ✅ detects active tab
          />
        ),
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="microphone" color={color} size={size} />
        ),
      })}
    />

    <Tab.Screen
      name="Account"
      component={AccountScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account" color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default AppNavigator;
