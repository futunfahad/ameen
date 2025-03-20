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
import CustomDrawer from "./app/components/CustomDrawer";
import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import AppNavigator from "./app/navigation/AppNavigator";
import { View, Text, TouchableOpacity, I18nManager } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";

// Force RTL layout (ensures drawer swipes from right)
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
}

// Create Drawer Navigator
const Drawer = createDrawerNavigator();

// Dummy Screens
const HomeScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>الشاشة الرئيسية</Text>
  </View>
);
const NotificationsScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>الإشعارات</Text>
  </View>
);
const RecordsScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>السجلات</Text>
  </View>
);
const CalendarScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>التقويم</Text>
  </View>
);

// Custom Header Menu Button (Right Side)
const CustomHeaderRight = () => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.openDrawer()}
      style={{ marginRight: 15 }}
    >
      <Icon name="menu" size={28} color="#fff" />
    </TouchableOpacity>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawer {...props} />}
        screenOptions={{
          drawerPosition: "right", // Swipes drawer from right
          headerStyle: { backgroundColor: "#2C3E50" },
          headerTintColor: "#fff",
          headerTitleAlign: "center",
          headerTitle: "تطبيقي", // Arabic App Title
          headerRight: () => <CustomHeaderRight />, // Moves hamburger to right
          headerLeft: () => null, // Removes duplicate left-side hamburger
        }}
      >
        <Drawer.Screen name="Home" component={AppNavigator} />
        <Drawer.Screen name="Notifications" component={NotificationsScreen} />
        <Drawer.Screen name="Records" component={RecordsScreen} />
        <Drawer.Screen name="Calendar" component={CalendarScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

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
