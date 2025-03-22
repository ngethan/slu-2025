import { Tabs } from "expo-router";
import { Home } from "lucide-react-native";
import { View } from "react-native";

export default function TabsNavigator() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          height: "12%",
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 5,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View
              className={`p-1 rounded-2xl ${focused ? "bg-yellow-400" : ""}`}
            >
              <Home size={30} color={focused ? "#fff" : "#333"} />
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
