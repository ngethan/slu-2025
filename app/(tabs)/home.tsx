import React, { useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NavigationDrawer from "../../components/Drawer";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const router = useRouter();

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const startRecording = () => {
    setIsRecording(true);
    // Add your actual recording logic here
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  if (isRecording) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-1 px-6 py-16">
          <Text className="text-3xl leading-relaxed">
            {transcribedText || "Listening..."}
          </Text>
        </View>

        <View className="absolute bottom-10 w-full items-center">
          <TouchableOpacity
            onPress={stopRecording}
            className="w-16 h-16 bg-red-500 rounded-full justify-center items-center"
          >
            <FontAwesome name="stop" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#FFFFFF", "#FFA500"]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <NavigationDrawer onClose={toggleDrawer} isOpen={drawerOpen} />

        <View className="flex-1 justify-center items-center px-6">
          <View className="w-full bg-white/80 rounded-xl p-4 mb-8 min-h-[150px] max-h-[200px]">
            <Text className="text-gray-800 text-lg">
              {transcribedText || "Your speech will appear here..."}
            </Text>
          </View>

          <TouchableOpacity
            className="w-24 h-24 bg-white rounded-full justify-center items-center shadow-lg"
            activeOpacity={0.7}
            onPress={startRecording}
          >
            <FontAwesome name="microphone" size={40} color="#FFA500" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}
