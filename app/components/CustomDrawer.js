import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import colors from "../config/colors";

const menuItems = [
  { label: "الشاشة الرئيسية", icon: "home", route: "AppHome" },
  {
    label: "صفحة النص المستخرج",
    icon: "file-document-outline",
    route: "Transcription",
  },
  { label: "الملخص", icon: "sort-variant", route: "Summary" },
  { label: "سجل المحفوظات", icon: "history", route: "History" },
  { label: "التقويم", icon: "calendar", route: "Calendar" },
];

export default function CustomDrawer(props) {
  const { navigation } = props;

  return (
    <View style={styles.container}>
      <View style={styles.header} />

      <DrawerContentScrollView
        {...props}
        // remove default scroll padding
        contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 0 }}
      >
        {menuItems.map((item) => (
          <DrawerItem
            key={item.route}
            onPress={() => navigation.navigate(item.route)}
            // strip DrawerItem’s built-in horizontal padding
            style={styles.drawerItem}
            label={() => (
              <View style={styles.menuItem}>
                <Text style={styles.label}>{item.label}</Text>
                <Icon name={item.icon} size={24} color={colors.medium} />
              </View>
            )}
          />
        ))}
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: colors.secondary,
    paddingVertical: 30,
    alignItems: "center",
  },

  // 👇 completely override DrawerItem padding
  drawerItem: {
    paddingHorizontal: 0,
<<<<<<< HEAD
    marginHorizontal: -10,
=======
    marginHorizontal: 0,
>>>>>>> 1996626fccc7ee8595a2d4c73280e26fbf3a2a84
  },

  // your custom row: text then icon
  menuItem: {
    flexDirection: "row",
    justifyContent: "flex-end", // push to the right edge
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 0, // now *your* content padding
  },

  label: {
    fontSize: 16,
    color: colors.dark,
    textAlign: "right",
    marginRight: 10, // space between text and icon
<<<<<<< HEAD
    paddingBottom: 5,
=======
>>>>>>> 1996626fccc7ee8595a2d4c73280e26fbf3a2a84
  },
});
