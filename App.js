import React, { useState, useEffect } from "react";
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <MeetingProvider>
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
          <AuthNavigator setIsLoggedIn={setIsLoggedIn} />
        )}
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
