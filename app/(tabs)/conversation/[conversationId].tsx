import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import { Mic } from "lucide-react-native";
import OpenAI from "openai";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { FlashList } from "@shopify/flash-list";

const openai = new OpenAI({
  apiKey:
    "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",
});

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams();
  const [messageHistory, setMessageHistory] = useState<
    { content: string; senderId: string }[]
  >([]);

  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [recording, setRecording] = useState<Audio.Recording>();

  const micButtonAnim = useRef(new Animated.Value(0)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const PAGE_SIZE = 20;
  const scrollViewRef = useRef<FlashList<any>>(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();

      const subscription = supabase
        .channel(`conversation_${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `conversationId=eq.${conversationId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setMessageHistory((prev) => [...prev, payload.new]);
              // Scroll to bottom on new message
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          },
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [conversationId]);

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

  const fetchMessages = useCallback(
    async (startIndex = 0) => {
      try {
        setIsLoadingMore(true);
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversationId", conversationId)
          .order("createdAt", { ascending: false })
          .range(startIndex, startIndex + PAGE_SIZE - 1);

        if (error) throw error;

        if (data) {
          const newMessages = data.reverse();
          if (startIndex === 0) {
            setMessageHistory(newMessages);
          } else {
            setMessageHistory((prev) => [...newMessages, ...prev]);
          }
          setHasMoreMessages(data.length === PAGE_SIZE);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        Alert.alert("Error", "Failed to load messages");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [conversationId],
  );

  const loadMoreMessages = useCallback(async () => {
    if (!isLoadingMore && hasMoreMessages) {
      await fetchMessages(messageHistory.length);
    }
  }, [isLoadingMore, hasMoreMessages, fetchMessages, messageHistory.length]);

  const renderMessage = useCallback(
    ({ item: message, index }) => (
      <View
        className={`mb-4 ${message.senderId === "user-id" ? "items-end" : "items-start"}`}
      >
        <View
          className={`p-3 rounded-lg ${message.senderId === "user-id" ? "bg-[#F29F18]" : "bg-gray-200"}`}
        >
          <Text
            className={
              message.senderId === "user-id" ? "text-white" : "text-black"
            }
          >
            {message.content}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            {new Date(message.createdAt).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    ),
    [],
  );

  const ListHeaderComponent = useCallback(
    () =>
      hasMoreMessages ? (
        <View className="py-2">
          <ActivityIndicator size="small" color="#999" />
        </View>
      ) : null,
    [hasMoreMessages],
  );

  const saveMessage = async (content: string, isUser: boolean = true) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("No user found");

      const { error } = await supabase.from("messages").insert({
        conversationId,
        content,
        senderId: isUser ? userData.user.id : "assistant-id",
      });

      if (error) throw error;

      await supabase
        .from("conversations")
        .update({
          lastMessage: content,
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

      // Determine file extension and set MIME type accordingly
      const extension = uri.split(".").pop() || "";
      let mimeType = "audio/m4a"; // default
      let fileName = "audio.m4a"; // default

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
        const transcribedText = transcriptionData.text;
        setTranscribedText(transcribedText);

        // Save the transcribed message
        await saveMessage(transcribedText);

        // Here you could also call OpenAI's API to get a response
        // and save the assistant's response using saveMessage(response, false)
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
          <FlashList
            ref={scrollViewRef}
            data={messageHistory}
            renderItem={renderMessage}
            estimatedItemSize={100}
            inverted
            className="w-full flex-1"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 20,
            }}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.3}
            ListHeaderComponent={ListHeaderComponent}
            refreshing={isLoadingMore}
          />

          {isRecording && (
            <View className="w-full mb-8">
              <Text className="text-white text-lg">
                {transcribedText || "Listening..."}
              </Text>
            </View>
          )}

          <View className="items-center mb-60">
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
