import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import NavigationDrawer from "@/components/Drawer";

export default function HomeScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const startRecording = async () => {
    if (!hasPermission) {
      await checkPermissions();
      if (!hasPermission) return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      await newRecording.startAsync();
      setRecording(newRecording);

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      Animated.parallel([
        Animated.timing(micButtonAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();

      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  if (isRecording) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={["#FFFFFF", "#FFA500"]}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View className="flex-1 justify-center items-center px-6">
            <Text className="text-2xl font-bold text-gray-800 mb-6">
              Recording...
            </Text>
            <TouchableOpacity
              className="w-24 h-24 bg-red-500 rounded-full justify-center items-center shadow-lg"
              activeOpacity={0.7}
              onPress={stopRecording}
            >
              <FontAwesome name="stop" size={40} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#FFA500", "#FFFFFF"]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View className="flex-1 items-center px-6">
          <View className="flex-1" />

          {isRecording && (
            <View className="w-full mb-8">
              <Text className="text-white text-lg">
                {transcribedText || "Listening..."}
              </Text>
            </View>
          )}

          <View className="items-center mb-40">
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: rotationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                  { scale: pulseAnim },
                ],
              }}
              className="w-[140px] h-[140px] rounded-full border border-[rgba(128,128,128,0.2)]"
            />

            <View className="w-[140px] h-[140px] items-center justify-center -mt-[140px]">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={isRecording ? stopRecording : startRecording}
                className={`items-center justify-center duration-150 w-[96px] h-[96px] rounded-full shadow-sm ${isRecording ? "bg-[#fff]" : "bg-[#F29F18]"}`}
              >
                {isRecording ? (
                  <View className="w-8 h-8 bg-red-500 rounded-lg" />
                ) : (
                  <Mic size={40} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
