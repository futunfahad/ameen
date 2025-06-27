import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import WelcomeScreen from "../screens/WelcomeScreen";

const Stack = createStackNavigator();
const AuthNavigator = ({ setIsLoggedIn }) => (
  <Stack.Navigator>
    <Stack.Screen
      name="Welcome"
      component={WelcomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="Login" options={{ title: "تسجيل دخول" }}>
      {(props) => <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
    </Stack.Screen>
    <Stack.Screen name="Register" options={{ title: "تسجيل حساب جديد" }}>
      {(props) => <RegisterScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
    </Stack.Screen>
  </Stack.Navigator>
);

export default AuthNavigator;
