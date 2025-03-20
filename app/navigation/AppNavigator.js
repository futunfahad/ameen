import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, StyleSheet, Image } from "react-native";

import AccountNavigator from "./AccountNavigator";
import FeedNavigator from "./FeedNavigator";
import ListingEditScreen from "../screens/ListingEditScreen";
import NewListingButton from "./NewListingButton";
import routes from "./routes";
import HomeScreen from "../screens/HomeScreen";

const Tab = createBottomTabNavigator();

const CustomHeader = () => (
  <View style={styles.headerContainer}>
    <View style={styles.logoContainer}>
      <Image source={require("../assets/logo.png")} style={styles.logo} />
    </View>
  </View>
);

const AppNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerTitle: () => <CustomHeader />, // Uses custom header with logo
      headerStyle: {
        backgroundColor: "transparent", // Makes header blend with background
        elevation: 0, // Removes shadow on Android
        shadowOpacity: 0, // Removes shadow on iOS
      },
      headerTransparent: true, // Ensures full transparency
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
        tabBarButton: () => (
          <NewListingButton
            onPress={() => navigation.navigate(routes.LISTING_EDIT)}
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

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-end", // Moves logo to the right
    alignItems: "center",
    paddingRight: 15, // Adjust spacing from the right
    width: "100%",
  },
  logoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)", // Semi-transparent background for visibility
    padding: 8,
    borderRadius: 10,
  },
  logo: {
    width: 50, // Adjust width
    height: 50, // Adjust height
    resizeMode: "contain",
  },
});

export default AppNavigator;
