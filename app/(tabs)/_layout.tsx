import { Tabs } from "expo-router";
import { History, House, UserPen } from "lucide-react-native";
import { View } from "react-native";

export default function TabsNavigator() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          height: 85,
          paddingTop: 16,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 0,
          shadowColor: "transparent",
        },
      }}
    >
      <Tabs.Screen
        name="conversation/new"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View
              className={`p-3 rounded-full ${focused ? "bg-yellow-400" : ""}`}
            >
              <House size={26} color={focused ? "#fff" : "#94A3B8"} />
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
              <History size={26} color={focused ? "#fff" : "#94A3B8"} />
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
              <UserPen size={26} color={focused ? "#fff" : "#94A3B8"} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="conversation/[conversationId]"
        options={{
          headerShown: false,
          href: null,
        }}
      />
    </Tabs>
  );
}
