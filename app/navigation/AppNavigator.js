import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import AccountNavigator from "./AccountNavigator";
import ListingEditScreen from "../screens/ListingEditScreen";
import routes from "./routes";
import HomeScreen from "../screens/HomeScreen";
import MeetingSummaryScreen from "../screens/MeetingSummaryScreen";
import NewListingButton from "./NewListingButton"; // make sure this is set up
import colors from "../config/colors";

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
      name="ListingEdit"
      component={ListingEditScreen}
      options={({ navigation }) => ({
        tabBarButton: (props) => (
          <NewListingButton
            onPress={() => navigation.navigate(routes.LISTING_EDIT)}
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
      component={AccountNavigator}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account" color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default AppNavigator;
