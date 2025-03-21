/*
import React, { useState, useEffect } from "react";
import { Button, Switch, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";

import Screen from "./app/components/Screen";
import { TextInput, Image } from "react-native";
import ImageInput from "./app/components/ImageInput";
import ImageInputList from "./app/components/ImageInputList";
import ListingEditScreen from "./app/screens/ListingEditScreen";
import ListingsScreen from "./app/screens/ListingsScreen";
import AccountScreen from "./app/screens/AccountScreen";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./app/navigation/AppNavigator";
import navigationTheme from "./app/navigation/navigationTheme";
import AuthNavigator from "./app/navigation/AuthNavigator";
import AccountNavigator from "./app/navigation/AccountNavigator";

import WelcomeScreen from "./app/screens/WelcomeScreen";
*/
import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  I18nManager,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";

import CustomDrawer from "./app/components/CustomDrawer";
import AppNavigator from "./app/navigation/AppNavigator";
import NotificationsScreen from "./app/screens/ListingEditScreen";
import RecordsScreen from "./app/screens/ListingEditScreen";
import CalendarScreen from "./app/screens/ListingEditScreen";
import colors from "./app/config/colors";

// RTL support
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
}

const Drawer = createDrawerNavigator();

// ✅ Add your logo as a custom header
const CustomHeader = () => (
  <View style={styles.headerContainer}>
    <View style={styles.logoContainer}>
      <Image source={require("./app/assets/logo.png")} style={styles.logo} />
    </View>
  </View>
);

// ✅ Optional custom header right (hamburger)
const CustomHeaderRight = () => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.openDrawer()}
      style={{ marginRight: 15 }}
    >
      <Icon name="menu" size={28} color={colors.secondary} />
    </TouchableOpacity>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawer {...props} />}
        screenOptions={{
          drawerPosition: "right",
          headerStyle: { backgroundColor: colors.white },
          headerTintColor: colors.secondary,
          headerTitleAlign: "center",

          // ✅ Show screen name as title
          headerTitle: ({ children }) => (
            <Text style={styles.headerTitle}>{children}</Text>
          ),

          // ✅ Show logo on the left
          headerLeft: () => (
            <View style={styles.logoWrapper}>
              <Image
                source={require("./app/assets/logo.png")}
                style={styles.logo}
              />
            </View>
          ),

          // ✅ Show hamburger menu on the right
          headerRight: () => <CustomHeaderRight />,
        }}
      >
        <Drawer.Screen name="HomeScreen" component={AppNavigator} />
        <Drawer.Screen name="Notifications" component={NotificationsScreen} />
        <Drawer.Screen name="Records" component={RecordsScreen} />
        <Drawer.Screen name="Calendar" component={CalendarScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.secondary,
  },
  logoWrapper: {
    marginLeft: 15,
  },
  logo: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },
});

/*
export default function App() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}
*/
{
  /* in app navigater always change <Tab.Screen
      name="Account"
      component={AccountNavigator}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account" color={color} size={size} />
        ),
        headerShown: false,
      }}


      in newlistingbutton const styles = StyleSheet.create({
        container: {
          alignItems: "center",
          backgroundColor: colors.primary,
          borderColor: colors.white,
          borderRadius: 40,
          borderWidth: 10,
          bottom: 30,
          height: 80,
          left: 17,
          justifyContent: "center",
          width: 80,
        },
      });

      change claints.js to this ip:93.169.76.60

      change imageinput result.assets[0].uri
    /> */
}
