// ✅ Reusable AudioPlayer component with slider and timestamp
import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import colors from "../config/colors";

export default function AudioPlayer({ uri }) {
  const sound = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return () => {
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, []);

  const loadAndPlay = async () => {
    if (sound.current) {
      await sound.current.unloadAsync();
      sound.current = null;
    }

    const { sound: newSound, status } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      updateStatus
    );
    sound.current = newSound;
    setDuration(status.durationMillis || 0);
    setIsPlaying(true);
  };

  const updateStatus = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlayPause = async () => {
    if (!sound.current) {
      await loadAndPlay();
    } else {
      const status = await sound.current.getStatusAsync();
      if (status.isPlaying) {
        await sound.current.pauseAsync();
      } else {
        await sound.current.playAsync();
      }
    }
  };

  const handleSliderChange = async (value) => {
    if (sound.current) {
      await sound.current.setPositionAsync(value);
    }
  };

  const millisToTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={togglePlayPause}>
        <MaterialCommunityIcons
          name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
          size={50}
          color={colors.secondary}
        />
      </TouchableOpacity>

      <Slider
        style={{ flex: 1, marginHorizontal: 10 }}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        onSlidingComplete={handleSliderChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor="#ddd"
        thumbTintColor={colors.secondary}
      />

      <Text style={{ width: 50, textAlign: "center" }}>
        {millisToTime(position)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
});
