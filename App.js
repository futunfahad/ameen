import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";

import AuthNavigator from "./app/navigation/AuthNavigator"; // ✅ your auth stack
import CustomDrawer from "./app/components/CustomDrawer";
import AppNavigator from "./app/navigation/AppNavigator";
import CalendarScreen from "./app/screens/CalendarScreen";
import TranscriptionScreen from "./app/screens/TranscriptionScreen";
import colors from "./app/config/colors";
import MeetingSummaryScreen from "./app/screens/MeetingSummaryScreen";
import HistoryScreen from "./app/screens/HistoryScreen";
import navigationTheme from "./app/navigation/navigationTheme";
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

const Drawer = createDrawerNavigator();

// RTL
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

const CustomHeaderLeft = ({ tintColor }) => {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  return (
    <View style={styles.headerLeftContainer}>
      {canGoBack ? (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Icon
            name={I18nManager.isRTL ? "arrow-right" : "arrow-left"}
            size={24}
            color={tintColor || colors.secondary}
          />
        </TouchableOpacity>
      ) : (
        <Image source={require("./app/assets/logo.png")} style={styles.logo} />
      )}
    </View>
  );
};

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
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 🔐 controls auth flow

  return (
    <NavigationContainer theme={navigationTheme}>
      {isLoggedIn ? (
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawer {...props} />}
          screenOptions={{
            drawerPosition: "right",
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.secondary,
            headerTitleAlign: "center",
            headerTitle: ({ children }) => (
              <Text style={styles.headerTitle}>{children}</Text>
            ),
            headerLeft: () => <CustomHeaderLeft />,
            headerRight: () => <CustomHeaderRight />,
          }}
        >
          <Drawer.Screen
            name="HomeScreen"
            component={AppNavigator}
            options={{ title: "الشاشة الرئيسية" }}
          />
          <Drawer.Screen
            name="Transcription"
            component={TranscriptionScreen}
            options={{ title: "صفحة النص المستخرج" }}
          />
          <Drawer.Screen
            name="History"
            component={HistoryScreen}
            options={{ title: "سجل المحفوظات" }}
          />
          <Drawer.Screen
            name="Summary"
            component={MeetingSummaryScreen}
            options={{ title: "ملخص الاجتماع" }}
          />
          <Drawer.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{ title: "التقويم" }}
          />
        </Drawer.Navigator>
      ) : (
        <AuthNavigator setIsLoggedIn={setIsLoggedIn} /> // 👈 pass function
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  iconButton: {
    marginRight: 10,
  },
  logo: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.secondary,
  },
});

/*
final log in screen 
import "react-native-gesture-handler";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  I18nManager,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";

import CustomDrawer from "./app/components/CustomDrawer";
import AppNavigator from "./app/navigation/AppNavigator";
import CalendarScreen from "./app/screens/CalendarScreen";
import TranscriptionScreen from "./app/screens/TranscriptionScreen";
import colors from "./app/config/colors";
import MeetingSummaryScreen from "./app/screens/MeetingSummaryScreen";
import HistoryScreen from "./app/screens/HistoryScreen";
import navigationTheme from "./app/navigation/navigationTheme";

// RTL support
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

const Drawer = createDrawerNavigator();
const CustomHeaderLeft = ({ tintColor }) => {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  return (
    <View style={styles.headerLeftContainer}>
      {canGoBack ? (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Icon
            name={I18nManager.isRTL ? "arrow-right" : "arrow-left"}
            size={24}
            color={tintColor || colors.secondary}
          />
        </TouchableOpacity>
      ) : (
        <Image source={require("./app/assets/logo.png")} style={styles.logo} />
      )}
    </View>
  );
};

// ✅ Hamburger menu on the right
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
    <NavigationContainer them={navigationTheme}>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawer {...props} />}
        screenOptions={{
          drawerPosition: "right",
          headerStyle: { backgroundColor: colors.white },
          headerTintColor: colors.secondary,
          headerTitleAlign: "center",

          headerTitle: ({ children }) => (
            <Text style={styles.headerTitle}>{children}</Text>
          ),
          headerLeft: () => <CustomHeaderLeft />,
          headerRight: () => <CustomHeaderRight />,
        }}
      >
        <Drawer.Screen
          name="HomeScreen"
          component={AppNavigator}
          options={{ title: "الشاشة الرئيسية" }}
        />
        <Drawer.Screen
          name="Transcription"
          component={TranscriptionScreen}
          options={{ title: "صفحة النص المستخرج" }}
        />
        <Drawer.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: "سجل المحفوظات" }}
        />
        <Drawer.Screen
          name="Summary"
          component={MeetingSummaryScreen}
          options={{ title: "ملخص الاجتماع" }}
        />
        <Drawer.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: "التقويم" }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  iconButton: {
    marginRight: 10,
  },
  logo: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.secondary,
  },
});

  */

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

/*

*/
