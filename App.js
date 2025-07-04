/*import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  View,
  StyleSheet,
  I18nManager,
  TouchableOpacity,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { MeetingProvider } from "./app/context/MeetingContext";
import colors from "./app/config/colors";
import navigationTheme from "./app/navigation/navigationTheme";

// Screens and Navigators
import WelcomeScreen from "./app/screens/WelcomeScreen";
import AppNavigator from "./app/navigation/AppNavigator";
import TranscriptionScreen from "./app/screens/TranscriptionScreen";
import MeetingSummaryScreen from "./app/screens/MeetingSummaryScreen";
import HistoryScreen from "./app/screens/HistoryScreen";
import CalendarScreen from "./app/screens/CalendarScreen";

// Custom Drawer Content
import CustomDrawer from "./app/components/CustomDrawer";

// Enable RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

const Drawer = createDrawerNavigator();

// Header Left: Logo only
function CustomHeaderLeft() {
  return (
    <View style={styles.headerLeftContainer}>
      <Image source={require("./app/assets/logo.png")} style={styles.logo} />
    </View>
  );
}

// Header Right: Back arrow (if any) then menu
function CustomHeaderRight({ navigation }) {
  const canGoBack = navigation.canGoBack();
  return (
    <View style={styles.headerRightContainer}>
      {canGoBack && (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Icon
            name={I18nManager.isRTL ? "arrow-left" : "arrow-right"}
            size={24}
            color={colors.secondary}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => navigation.openDrawer()}
        style={styles.iconButton}
      >
        <Icon name="menu" size={28} color={colors.secondary} />
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <WelcomeScreen />;
  }

  return (
    <MeetingProvider>
      <NavigationContainer theme={navigationTheme}>
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawer {...props} />}
          drawerPosition="right"
          screenOptions={({ navigation }) => ({
            drawerPosition: "right",
            drawerStyle: { width: 260 },
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.secondary,
            headerTitleAlign: "center",
            headerLeft: () => <CustomHeaderLeft />,
            headerRight: () => <CustomHeaderRight navigation={navigation} />,
            headerLeftContainerStyle: { paddingLeft: 15 },
            headerRightContainerStyle: { paddingRight: 15 },
          })}
        >
          <Drawer.Screen
            name="AppHome"
            component={AppNavigator}
            options={{ title: "الشاشة الرئيسية", drawerLabel: "الرئيسية" }}
          />
          <Drawer.Screen
            name="Transcription"
            component={TranscriptionScreen}
            options={{ title: "صفحة النص المستخرج" }}
          />
          <Drawer.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{ title: "التقويم" }}
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
        </Drawer.Navigator>
      </NavigationContainer>
    </MeetingProvider>
  );
}

const styles = StyleSheet.create({
  headerLeftContainer: {
    marginLeft: 15,
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  iconButton: {
    marginHorizontal: 8,
  },
  logo: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },
});
*/
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  View,
  StyleSheet,
  I18nManager,
  TouchableOpacity,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { MeetingProvider } from "./app/context/MeetingContext";
import colors from "./app/config/colors";
import navigationTheme from "./app/navigation/navigationTheme";

// Screens and Navigators
import WelcomeScreen from "./app/screens/WelcomeScreen";
import AppNavigator from "./app/navigation/AppNavigator";
import TranscriptionScreen from "./app/screens/TranscriptionScreen";
import MeetingSummaryScreen from "./app/screens/MeetingSummaryScreen";
import HistoryScreen from "./app/screens/HistoryScreen";
import CalendarScreen from "./app/screens/CalendarScreen";

// Custom Drawer Content
import CustomDrawer from "./app/components/CustomDrawer";

// Enable RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

const Drawer = createDrawerNavigator();

// HeaderRight: Shows back arrow (if any), else logo
function CustomHeaderRight({ navigation }) {
  const canGoBack = navigation.canGoBack();
  return (
    <View style={styles.headerRightContainer}>
      {canGoBack ? (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Icon
            name={I18nManager.isRTL ? "arrow-left" : "arrow-right"}
            size={24}
            color={colors.secondary}
          />
        </TouchableOpacity>
      ) : (
        <Image source={require("./app/assets/logo.png")} style={styles.logo} />
      )}
    </View>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <WelcomeScreen />;
  }

  return (
    <MeetingProvider>
      <NavigationContainer theme={navigationTheme}>
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawer {...props} />}
          drawerPosition="right"
          screenOptions={({ navigation }) => ({
            drawerPosition: "right",
            drawerStyle: { width: 260 },
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.secondary,
            headerTitleAlign: "center",
            headerTitleStyle: { paddingBottom: 5 },
            // Left: Menu always
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.openDrawer()}
                style={styles.iconButton}
              >
                <Icon name="menu" size={28} color={colors.secondary} />
              </TouchableOpacity>
            ),
            // Right: Arrow or logo
            headerRight: () => <CustomHeaderRight navigation={navigation} />,
            headerLeftContainerStyle: { paddingLeft: 15 },
            headerRightContainerStyle: { paddingRight: 15 },
          })}
        >
          <Drawer.Screen
            name="AppHome"
            component={AppNavigator}
            options={{ title: "الشاشة الرئيسية", drawerLabel: "الرئيسية" }}
          />
          <Drawer.Screen
            name="Transcription"
            component={TranscriptionScreen}
            options={{ title: "صفحة النص المستخرج" }}
          />
          <Drawer.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{ title: "التقويم" }}
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
        </Drawer.Navigator>
      </NavigationContainer>
    </MeetingProvider>
  );
}

const styles = StyleSheet.create({
  headerRightContainer: {
    marginRight: 15,
    // If you want the arrow/logo aligned exactly like default, you can add:
    // flexDirection: 'row', alignItems: 'center'
  },
  iconButton: {
    marginHorizontal: 0,
  },
  logo: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },
});
