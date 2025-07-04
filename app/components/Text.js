import React from "react";
import { Text } from "react-native";

import defaultStyles from "../config/styles";

function AppText({ children, style, ...otherProps }) {
  return (
<<<<<<< HEAD
    <Text
      style={[defaultStyles.text, style, { paddingBottom: 3 }]}
      {...otherProps}
    >
=======
    <Text style={[defaultStyles.text, style]} {...otherProps}>
>>>>>>> 1996626fccc7ee8595a2d4c73280e26fbf3a2a84
      {children}
    </Text>
  );
}

export default AppText;
