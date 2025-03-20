import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";

const CustomDrawer = (props) => {
  const navigation = useNavigation();

  const menuItems = [
    { name: "الشاشة الرئيسية", icon: "home", route: "Home" },
    { name: "الإشعارات", icon: "bell", route: "Notifications" },
    { name: "السجلات", icon: "file-document", route: "Records" },
    { name: "التقويم", icon: "calendar", route: "Calendar" },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Header Section */}
      <View style={styles.header}>
        <Icon
          name="account-circle"
          size={50}
          color="#fff"
          style={styles.profileIcon}
        />
        <Text style={styles.username}>John Doe</Text>
      </View>

      {/* Drawer Items */}
      <DrawerContentScrollView {...props}>
        {menuItems.map((item, index) => (
          <View key={index} style={styles.menuItem}>
            <Icon name={item.icon} size={24} color="#000" style={styles.icon} />
            <DrawerItem
              label={item.name}
              onPress={() => navigation.navigate(item.route)}
              labelStyle={styles.labelStyle}
              style={styles.drawerItem}
            />
          </View>
        ))}
      </DrawerContentScrollView>
    </View>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#2C3E50",
    paddingVertical: 30,
    alignItems: "center",
  },
  profileIcon: {
    marginBottom: 5,
  },
  username: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  menuItem: {
    flexDirection: "row-reverse", // Moves icon fully to the right
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 5,
  },
  icon: {
    marginLeft: 10, // Creates space between icon and text
  },
  labelStyle: {
    fontSize: 16,
    textAlign: "right", // Aligns text to the right
    flex: 1, // Ensures text does not disappear
    color: "#000",
  },
  drawerItem: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
