import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { History, House, UserPen } from "lucide-react-native";
import { View } from "react-native";

export default function TabsNavigator() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          height: 85,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 0,
          shadowColor: "transparent",
          shadowOffset: {
            width: 0,
            height: 0,
          },
          shadowOpacity: 0,
          shadowRadius: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View
              className={`p-3 rounded-full ${focused ? "bg-yellow-400" : ""}`}
            >
              <House
                size={26}
                color={focused ? "#fff" : "#94A3B8"}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View
              className={`p-3 rounded-full ${focused ? "bg-yellow-400" : ""}`}
            >
              <History
                size={26}
                color={focused ? "#fff" : "#94A3B8"}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View
              className={`p-3 rounded-full ${focused ? "bg-yellow-400" : ""}`}
            >
              <UserPen
                size={26}
                color={focused ? "#fff" : "#94A3B8"}
              />
            </View>
          ),
        }}
      />
      {/* <Tabs.Screen
        name="chat"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View
              className={`p-1 rounded-2xl ${focused ? "bg-yellow-400" : ""}`}
            >
              <FontAwesome
                name="comments"
                size={24}
                color={focused ? "#fff" : "#333"}
              />
            </View>
          ),
        }}
      /> */}
    </Tabs>
  );
}
