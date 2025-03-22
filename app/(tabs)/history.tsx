import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList, TextInput, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { Calendar, DateData } from "react-native-calendars";

type Mood = "happy" | "sad" | "angry" | "anxious" | "neutral" | "excited" | "tired" | "grateful" | "stressed" | "peaceful";

interface Conversation {
  id: string;
  date: string;
  title: string;
  preview: string;
  mood: Mood;
}

interface ConversationsByDate {
  [date: string]: Conversation[];
}

const PRESET_MOODS: { value: Mood; label: string; color: string }[] = [
  { value: "happy", label: "Happy", color: "#FFD700" },
  { value: "sad", label: "Sad", color: "#4A90E2" },
  { value: "angry", label: "Angry", color: "#FF6B6B" },
  { value: "anxious", label: "Anxious", color: "#9B59B6" },
  { value: "neutral", label: "Neutral", color: "#95A5A6" },
  { value: "excited", label: "Excited", color: "#FF8C00" },
  { value: "tired", label: "Tired", color: "#34495E" },
  { value: "grateful", label: "Grateful", color: "#2ECC71" },
  { value: "stressed", label: "Stressed", color: "#E74C3C" },
  { value: "peaceful", label: "Peaceful", color: "#1ABC9C" },
];

// Mock data for past conversations
const mockConversations: Conversation[] = [
  {
    id: "1",
    date: "2024-03-20",
    title: "Morning Reflection",
    preview: "Today I woke up feeling energized and ready to tackle the day...",
    mood: "happy",
  },
  {
    id: "2",
    date: "2024-03-19",
    title: "Evening Thoughts",
    preview: "Had a challenging day at work, but learned a lot...",
    mood: "stressed",
  },
  {
    id: "3",
    date: "2024-03-18",
    title: "Gratitude Journal",
    preview: "Feeling grateful for my family and friends...",
    mood: "grateful",
  },
  {
    id: "4",
    date: "2024-03-17",
    title: "Weekend Reflection",
    preview: "Spent the weekend working on my project...",
    mood: "excited",
  },
  {
    id: "5",
    date: "2024-03-16",
    title: "Daily Check-in",
    preview: "Feeling a bit anxious about the upcoming presentation...",
    mood: "anxious",
  },
];

// Group conversations by date
const groupConversationsByDate = (conversations: Conversation[]): ConversationsByDate => {
  return conversations.reduce((acc, conversation) => {
    const date = conversation.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(conversation);
    return acc;
  }, {} as ConversationsByDate);
};

// Get mood color
const getMoodColor = (mood: Mood): string => {
  const moodData = PRESET_MOODS.find(m => m.value === mood);
  return moodData?.color || "#95A5A6";
};

export default function HistoryScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  // Filter conversations based on search query and selected mood
  const filteredConversations = useMemo(() => {
    return mockConversations.filter(conversation => {
      const matchesSearch = conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          conversation.preview.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMood = !selectedMood || conversation.mood === selectedMood;
      return matchesSearch && matchesMood;
    });
  }, [searchQuery, selectedMood]);

  const groupedConversations = useMemo(() => {
    return groupConversationsByDate(filteredConversations);
  }, [filteredConversations]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
      onPress={() => router.push("/(tabs)/home")}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-gray-800">{item.title}</Text>
        <View 
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: getMoodColor(item.mood) + '20' }}
        >
          <Text 
            className="text-sm font-medium"
            style={{ color: getMoodColor(item.mood) }}
          >
            {PRESET_MOODS.find(m => m.value === item.mood)?.label}
          </Text>
        </View>
      </View>
      <Text className="text-gray-600">{item.preview}</Text>
    </TouchableOpacity>
  );

  const renderDateSection = ({ date, conversations }: { date: string; conversations: Conversation[] }) => (
    <View className="mb-6">
      <Text className="text-xl font-bold text-gray-800 mb-3">{date}</Text>
      {conversations.map((conversation) => (
        <View key={conversation.id}>
          {renderConversation({ item: conversation })}
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-16 pb-4">
        <Text className="text-3xl font-bold text-gray-800">Your Journey</Text>
      </View>

      <View className="px-4 mb-4">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-2">
          <FontAwesome name="search" size={20} color="#666" />
          <TextInput
            className="flex-1 ml-3 text-gray-800"
            placeholder="Search entries..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-4"
      >
        <View className="flex-row space-x-2">
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              selectedMood === null ? 'bg-orange-500' : 'bg-gray-100'
            }`}
            onPress={() => setSelectedMood(null)}
          >
            <Text className={`font-medium ${
              selectedMood === null ? 'text-white' : 'text-gray-600'
            }`}>
              All
            </Text>
          </TouchableOpacity>
          {PRESET_MOODS.map((mood) => (
            <TouchableOpacity
              key={mood.value}
              className={`px-4 py-2 rounded-full ${
                selectedMood === mood.value ? 'bg-orange-500' : 'bg-gray-100'
              }`}
              onPress={() => setSelectedMood(mood.value)}
            >
              <Text className={`font-medium ${
                selectedMood === mood.value ? 'text-white' : 'text-gray-600'
              }`}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: "#FFA500" },
        }}
        theme={{
          selectedDayBackgroundColor: "#FFA500",
          todayTextColor: "#FFA500",
          arrowColor: "#FFA500",
        }}
      />

      <FlatList
        data={Object.entries(groupedConversations).sort((a, b) => b[0].localeCompare(a[0]))}
        renderItem={({ item: [date, conversations] }) => renderDateSection({ date, conversations })}
        keyExtractor={([date]) => date}
        contentContainerClassName="px-4"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
} 