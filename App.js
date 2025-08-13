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
import ArchiveScreen from "./app/screens/ArchiveScreen";

// Custom Drawer Content
import CustomDrawer from "./app/components/CustomDrawer";

const Drawer = createDrawerNavigator();
I18nManager.forceRTL(false);
I18nManager.allowRTL(false);

// Header Left: Back Arrow or Logo
function CustomHeaderLeft({ navigation }) {
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
            color={colors.secondary}
          />
        </TouchableOpacity>
      ) : (
        <Image source={require("./app/assets/logo.png")} style={styles.logo} />
      )}
    </View>
  );
}

// Header Right: Drawer Toggle
function CustomHeaderRight({ navigation }) {
  return (
    <TouchableOpacity
      onPress={() => navigation.openDrawer()}
      style={styles.menuButton}
    >
      <Icon name="menu" size={28} color={colors.secondary} />
    </TouchableOpacity>
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
            headerTitleStyle: { fontSize: 23, paddingBottom: 5 },
            headerTintColor: colors.secondary,
            headerTitleAlign: "center",
            headerLeft: () => <CustomHeaderLeft navigation={navigation} />,
            headerRight: () => <CustomHeaderRight navigation={navigation} />,
            headerLeftContainerStyle: { paddingLeft: 15 },
            headerRightContainerStyle: { paddingRight: 15 },
          })}
        >
          <Drawer.Screen
            name="AppHome"
            component={AppNavigator}
            options={{
              title: "الشاشة الرئيسية",
              drawerLabel: "الرئيسية",
            }}
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
          <Drawer.Screen
            name="Archive"
            component={ArchiveScreen}
            options={{ title: "معلومات الاجتماع" }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </MeetingProvider>
  );
}

const styles = StyleSheet.create({
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  iconButton: { marginRight: 10 },
  logo: { width: 35, height: 35, resizeMode: "contain" },
  menuButton: { marginRight: 15 },
});
