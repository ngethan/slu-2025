import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { Calendar, DateData } from "react-native-calendars";
import { supabase } from "@/lib/supabase";

interface Conversation {
  id: string;
  chatName: string;
  createdAt: string;
  lastDate: string;
  ownerId: string | null;
}

interface ConversationsByDate {
  [date: string]: Conversation[];
}

// Group conversations by date
const groupConversationsByDate = (
  conversations: Conversation[],
): ConversationsByDate => {
  return conversations.reduce((acc, conversation) => {
    try {
      // Safely handle date parsing
      const date = conversation.createdAt
        ? new Date(conversation.createdAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(conversation);
    } catch (error) {
      console.error("Error parsing date:", error);
      // Use today's date as fallback
      const today = new Date().toISOString().split("T")[0];
      if (!acc[today]) {
        acc[today] = [];
      }
      acc[today].push(conversation);
    }
    return acc;
  }, {} as ConversationsByDate);
};

export default function HistoryScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations from Supabase
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let query = supabase
          .from("conversations")
          .select("*")
          .order("createdAt", { ascending: false });

        // Add date filter if selected
        if (selectedDate) {
          const startOfDay = new Date(selectedDate);
          const endOfDay = new Date(selectedDate);
          endOfDay.setDate(endOfDay.getDate() + 1);

          query = query
            .gte("createdAt", startOfDay.toISOString())
            .lt("createdAt", endOfDay.toISOString());
        }

        const { data, error: supabaseError } = await query;

        if (supabaseError) throw supabaseError;

        setConversations(data || []);
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch conversations",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [selectedDate]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesSearch =
        searchQuery === "" ||
        (conversation.chatName?.toLowerCase() || "").includes(
          searchQuery.toLowerCase(),
        );
      return matchesSearch;
    });
  }, [conversations, searchQuery]);

  const groupedConversations = useMemo(() => {
    return groupConversationsByDate(filteredConversations);
  }, [filteredConversations]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString === selectedDate ? "" : day.dateString);
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/conversation/${item.id}`)}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-gray-800">
          {item.chatName || "Voice Chat"}
        </Text>
        <Text className="text-sm text-gray-500">
          {item.createdAt
            ? new Date(item.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "America/Chicago",
              })
            : "Time not available"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderDateSection = ({
    date,
    conversations,
  }: {
    date: string;
    conversations: Conversation[];
  }) => (
    <View className="mb-6">
      <Text className="text-xl font-bold text-gray-800 mb-3">
        {(() => {
          try {
            return new Date(date).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          } catch (err) {
            console.error(err);
            return "Date not available";
          }
        })()}
      </Text>
      {conversations.map((conversation) => (
        <View key={conversation.id}>
          {renderConversation({ item: conversation })}
        </View>
      ))}
    </View>
  );

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-orange-500 px-6 py-3 rounded-full"
          onPress={() => setSelectedDate("")}
        >
          <Text className="text-white font-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesome name="times-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

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

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFA500" />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-gray-500 text-center mb-2">
            No conversations found
          </Text>
          <Text className="text-gray-400 text-center">
            {searchQuery
              ? "Try different search terms"
              : "Start a conversation to see it here"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={Object.entries(groupedConversations).sort((a, b) =>
            b[0].localeCompare(a[0]),
          )}
          renderItem={({ item: [date, conversations] }) =>
            renderDateSection({ date, conversations })
          }
          keyExtractor={([date]) => date}
          contentContainerClassName="px-4"
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
