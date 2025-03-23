import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import { Mic } from "lucide-react-native";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system";

const openai = new OpenAI({
  apiKey:
    "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",
});

interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: string;
}

export default function HomeScreen() {
  const { conversationId } = useLocalSearchParams();
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording>();
  const [messages, setMessages] = useState<Message[]>([]);

  const micButtonAnim = useRef(new Animated.Value(0)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [showInitialText, setShowInitialText] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await supabase.auth.getUser();
      if (!session.data.user?.id) router.push("/");
      setSessionId(session.data.user?.id);
    };

    const checkConversation = async () => {
      if (!conversationId) router.push("/(tabs)/history");
      const conversation = await supabase
        .from("conversations")
        .select()
        .eq("id", conversationId)
        .single();
      if (!conversation) router.replace("/(tabs)/history");
    };

    checkConversation();
    checkAuth();
    checkPermissions();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversationId", conversationId)
        .order("createdAt", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((currentMessages) => [
            ...currentMessages,
            payload.new as Message,
          ]);
        },
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

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
      // Only create new conversation if we don't have one
      if (!conversationId) {
        const newConversationId = await createNewConversation();
        if (!newConversationId) return;
      }

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
    if (showInitialText) setShowInitialText(false);

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

  const getAIResponse = async (userMessage: string) => {
    if (!conversationId || !sessionId) return;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-2024-11-20",
        messages: [
          {
            role: "system",
            content:
              "You are an empathetic and professional mental health therapist. Keep your responses short and to the point. Your responses should be supportive, understanding, and help guide the user toward better mental well-being Focus on active listening, validation, and gentle guidance.",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (aiResponse) {
        console.log("AI Response:", aiResponse);

        try {
          const voiceResponse = await fetch(
            "https://api.elevenlabs.io/v1/text-to-speech/XB0fDUnXU5powFXDhCwa?output_format=mp3_44100_128",
            {
              method: "POST",
              headers: {
                "xi-api-key":
                  "sk_1c857d5a9461bdab241610635be1894c2e69b6b2635f3f6f",
                voice_settings: "{ speed: 1.15 }",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: aiResponse,
                model_id: "eleven_multilingual_v2",
              }),
            },
          );

          if (!voiceResponse.ok) {
            throw new Error("Failed to get voice response");
          }

          const tempFilePath = FileSystem.documentDirectory + "temp.mp3";
          console.log("Temp file path:", tempFilePath);

          const audioData = await voiceResponse.arrayBuffer();
          console.log("Received audio data, size:", audioData.byteLength);

          await FileSystem.writeAsStringAsync(
            tempFilePath,
            arrayBufferToBase64(audioData),
            {
              encoding: FileSystem.EncodingType.Base64,
            },
          );

          console.log("Audio file written to disk");

          // Configure audio session
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
          });

          const soundObject = new Audio.Sound();
          console.log("Loading audio file...");
          await soundObject.loadAsync({ uri: tempFilePath });
          console.log("Audio file loaded");

          soundObject.setOnPlaybackStatusUpdate(async (status) => {
            console.log("Playback status:", status);
            if (status.didJustFinish) {
              console.log("Playback finished, cleaning up...");
              await soundObject.unloadAsync();
              await FileSystem.deleteAsync(tempFilePath);
            }
          });

          console.log("Starting playback...");
          await soundObject.playAsync();
        } catch (audioError) {
          console.error("Error playing audio:", audioError);
          // Fallback to basic speech
          Speech.speak(aiResponse);
        }

        await supabase.from("messages").insert({
          conversationId: conversationId,
          content: aiResponse,
          senderId: "13b8449a-c108-40d9-8050-e5c5f3659bcc",
        });
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      Alert.alert("Error", "Failed to get AI response");
    }
  };

  // Helper function to convert ArrayBuffer to Base64
  function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  const saveMessage = async (content: string) => {
    if (!conversationId || !sessionId) return;

    try {
      const { data: existingMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("conversationId", conversationId)
        .order("createdAt", { ascending: true });

      const isThirdMessage = existingMessages && existingMessages.length === 2;

      const { error } = await supabase
        .from("messages")
        .insert({
          conversationId: conversationId,
          content: content,
          senderId: sessionId,
        })
        .select()
        .single();

      if (error) throw error;

      if (isThirdMessage) {
        try {
          // Combine all messages for context
          const messageHistory =
            existingMessages
              .map(
                (msg) =>
                  `${msg.senderId === sessionId ? "User" : "Therapist"}: ${msg.content}`,
              )
              .join("\n") + `\nUser: ${content}`;

          const titleResponse = await openai.chat.completions.create({
            model: "gpt-4o-2024-11-20",
            messages: [
              {
                role: "system",
                content:
                  "Based on this conversation, generate a brief title (3-5 words) that captures the main theme or concern. Return ONLY the title without quotes or punctuation.",
              },
              {
                role: "user",
                content: messageHistory,
              },
            ],
          });

          const generatedTitle =
            titleResponse.choices[0]?.message?.content || "New Voice Chat";

          // Update conversation title
          await supabase
            .from("conversations")
            .update({
              chatName: generatedTitle,
              lastMessage: content,
              preview: content.substring(0, 100),
              lastDate: new Date().toISOString(),
            })
            .eq("id", conversationId);
        } catch (titleError) {
          console.error("Error generating title:", titleError);
          // Continue with default updates even if title generation fails
          await supabase
            .from("conversations")
            .update({
              lastMessage: content,
              preview: content.substring(0, 100),
              lastDate: new Date().toISOString(),
            })
            .eq("id", conversationId);
        }
      } else {
        // Regular update for subsequent messages
        await supabase
          .from("conversations")
          .update({
            lastMessage: content,
            preview: content.substring(0, 100),
            lastDate: new Date().toISOString(),
          })
          .eq("id", conversationId);
      }

      await getAIResponse(content);
    } catch (error) {
      console.error("Error saving message:", error);
      Alert.alert("Error", "Failed to save message");
    }
  };

  const transcribeAudio = async (uri: string) => {
    try {
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
        await saveMessage(transcribedContent);
      } else {
        Alert.alert("Error", "Failed to transcribe audio");
      }
    } catch (error) {
      console.error("Transcription error:", error);
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
          <ScrollView
            ref={scrollViewRef}
            style={{ height: "50%", width: "100%", marginTop: 50 }}
            onContentSizeChange={() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {messages.map((message) => (
              <View key={message.id} className="w-full mb-4">
                {message.senderId ===
                  "13b8449a-c108-40d9-8050-e5c5f3659bcc" && (
                  <Text className="text-gray-500 text-sm mb-1">Therapist</Text>
                )}
                <Text className="text-black text-xl">{message.content}</Text>
              </View>
            ))}

            {!isRecording && showInitialText && (
              <View className="w-full">
                <Text className="text-black text-3xl font-semibold">
                  You can speak when you're ready
                </Text>
              </View>
            )}

            {isRecording && (
              <View className="w-full">
                <Text className="text-black text-3xl font-semibold">
                  Listening...
                </Text>
              </View>
            )}
          </ScrollView>

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
