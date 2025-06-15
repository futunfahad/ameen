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

<<<<<<< HEAD
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
=======
// 🧩 استيراد الشاشات
import AuthNavigator from "./app/navigation/AuthNavigator";
import AppNavigator from "./app/navigation/AppNavigator";
import CalendarScreen from "./app/screens/CalendarScreen";
import TranscriptionScreen from "./app/screens/TranscriptionScreen";
import MeetingSummaryScreen from "./app/screens/MeetingSummaryScreen";
import HistoryScreen from "./app/screens/HistoryScreen";
import CustomDrawer from "./app/components/CustomDrawer";
import colors from "./app/config/colors";
import navigationTheme from "./app/navigation/navigationTheme";

// ✅ استيراد السياق
import { MeetingProvider } from "./app/context/MeetingContext";

// ✅ دعم اللغة العربية (يمين إلى يسار)
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

const Drawer = createDrawerNavigator();
<<<<<<< HEAD
=======

const CustomHeaderLeft = ({ tintColor }) => {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315

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
<<<<<<< HEAD
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <WelcomeScreen />;
  }
=======
  const [isLoggedIn, setIsLoggedIn] = useState(false);
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315

  return (
    <MeetingProvider>
      <NavigationContainer theme={navigationTheme}>
<<<<<<< HEAD
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawer {...props} />}
          drawerPosition="right"
          screenOptions={({ navigation }) => ({
            drawerPosition: "right",
            drawerStyle: { width: 260 },
            headerStyle: { backgroundColor: colors.white },
            headerTintColor: colors.secondary,
            headerTitleAlign: "center",
            headerLeft: () => <CustomHeaderLeft navigation={navigation} />,
            headerRight: () => <CustomHeaderRight navigation={navigation} />,
          })}
        >
          <Drawer.Screen
            name="AppHome"
            component={AppNavigator}
            options={{
              title: "الشاشة الرئيسية", // shows up in the header
              drawerLabel: "الرئيسية", // shows up in the side drawer
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
        </Drawer.Navigator>
=======
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
          <AuthNavigator setIsLoggedIn={setIsLoggedIn} />
        )}
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
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
