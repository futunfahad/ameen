import React from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ListItem } from "../components/lists";
import Screen from "../components/Screen";
import colors from "../config/colors";
import Icon from "../components/Icon";

const user = {
  name: "اسم المستخدم",
  email: "user@example.com",
  image: require("../assets/user.png"), // 👤 use your own image asset
};

const menuItems = [
  {
    title: "قائمتي",
    icon: {
      name: "format-list-bulleted",
      backgroundColor: colors.primary,
    },
    targetScreen: "MyListings",
  },
  {
    title: "الرسائل",
    icon: {
      name: "email",
      backgroundColor: colors.secondary,
    },
    targetScreen: "Messages",
  },
];

function AccountScreen({ navigation }) {
  const handleLogout = () => {
    Alert.alert("تم تسجيل الخروج");
    // TODO: clear auth state
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <ListItem title={user.name} subTitle={user.email} image={user.image} />
      </View>

      <View style={styles.container}>
        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.title}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <ListItem
              title={item.title}
              IconComponent={
                <Icon
                  name={item.icon.name}
                  backgroundColor={item.icon.backgroundColor}
                />
              }
              onPress={() => navigation.navigate(item.targetScreen)}
            />
          )}
        />
      </View>

      <ListItem
        title="تسجيل خروج"
        IconComponent={<Icon name="logout" backgroundColor="#ffe66d" />}
        onPress={handleLogout}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.light,
  },
  container: {
    marginVertical: 20,
  },
  separator: {
    height: 1,
    backgroundColor: colors.light,
  },
});

export default AccountScreen;
