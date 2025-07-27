import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AccountScreen from "../screens/AccountScreen";
import MessagesScreen from "../screens/MessagesScreen";

const Stack = createStackNavigator();

const AccountNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen
      options={{ headerShown: false }}
      name="Account"
      component={AccountScreen}
    />
    <Stack.Screen
      options={{ headerShown: false }}
      name="Messages"
      component={MessagesScreen}
    />
  </Stack.Navigator>
);

export default AccountNavigator;
