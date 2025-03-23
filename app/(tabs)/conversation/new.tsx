import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import { Mic } from "lucide-react-native";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

const openai = new OpenAI({
  apiKey:
    "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",
});

export default function HomeScreen() {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [recording, setRecording] = useState<Audio.Recording>();
  const [conversationId, setConversationId] = useState<string | null>(null);

  const micButtonAnim = useRef(new Animated.Value(0)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const checkAuth = async () => {
      const session = await supabase.auth.getUser();
      if (!session.data.user?.id) router.push("/");
      setSessionId(session.data.user?.id);
    };

    checkAuth();
    checkPermissions();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, [pulseAnim, rotationAnim]);

  const checkPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === "granted");
      if (status !== "granted") {
        Alert.alert("Permission to access microphone was denied");
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };

  const createNewConversation = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          chatName: "New Voice Chat",
          lastDate: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      Alert.alert("Error", "Failed to create conversation");
      return null;
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      await checkPermissions();
      if (!hasPermission) return;
    }

    try {
      // Create new conversation when starting recording
      const newConversationId = await createNewConversation();
      if (!newConversationId) return;

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
      console.log("Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);

      Animated.parallel([
        Animated.timing(micButtonAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();

      console.log("Recording stopped. File URI:", uri);

      if (uri) {
        await transcribeAudio(uri);
      } else {
        Alert.alert("Error", "No recording URI found");
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  const saveMessage = async (content: string) => {
    if (!conversationId) return;

    try {
      const { error } = await supabase.from("messages").insert({
        conversationId: conversationId,
        content: content,
        senderId: sessionId,
      });

      if (error) throw error;

      await supabase
        .from("conversations")
        .update({
          lastMessage: content,
          preview: content.substring(0, 100),
          lastDate: new Date().toISOString(),
        })
        .eq("id", conversationId);
    } catch (error) {
      console.error("Error saving message:", error);
      Alert.alert("Error", "Failed to save message");
    }
  };

  const transcribeAudio = async (uri: string) => {
    try {
      setTranscribedText("Transcribing...");
      console.log("Transcribing audio from URI:", uri);

      const extension = uri.split(".").pop() || "";
      let mimeType = "audio/m4a";
      let fileName = "audio.m4a";

      if (extension === "mp3") {
        mimeType = "audio/mp3";
        fileName = "audio.mp3";
      } else if (extension === "wav") {
        mimeType = "audio/wav";
        fileName = "audio.wav";
      } else if (extension === "caf") {
        mimeType = "audio/x-caf";
        fileName = "audio.caf";
      } else if (extension === "m4a") {
        mimeType = "audio/m4a";
        fileName = "audio.m4a";
      }

      const formData = new FormData();
      formData.append("file", {
        uri,
        type: mimeType,
        name: fileName,
      } as any);
      formData.append("model", "whisper-1");

      console.log("Sending transcription request with:", {
        file: uri,
        model: "whisper-1",
      });

      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openai.apiKey}`,
            // Let fetch set Content-Type for FormData automatically
          },
          body: formData,
        },
      );

      const transcriptionData = await response.json();
      console.log("Transcription response:", transcriptionData);

      if (response.ok) {
        const transcribedContent = transcriptionData.text;
        setTranscribedText(transcribedContent);
        await saveMessage(transcribedContent);
      } else {
        setTranscribedText("Transcription failed");
        Alert.alert("Error", "Failed to transcribe audio");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      setTranscribedText("Transcription failed");
      Alert.alert("Error", "Failed to transcribe audio");
    }
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={isRecording ? ["#F9D8A2", "#F9D8A2"] : ["#FFFFFF", "#F6BD60"]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View className="flex-1 items-center px-6">
          {isRecording && (
            <View className="w-full mt-24">
              <Text className="text-black text-3xl font-semibold">
                {transcribedText || "Listening..."}
              </Text>
            </View>
          )}

          <View className="flex-1" />

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
                className={`items-center justify-center duration-150 w-[96px] h-[96px] rounded-full shadow-sm ${
                  isRecording ? "bg-[#fff]" : "bg-[#F29F18]"
                }`}
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
