import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Switch, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] = useState(false);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    dailyReminder: true,
    weeklyInsights: true,
    moodTracking: true,
    newFeatures: false,
  });

  useEffect(() => {
    if (user) {
      console.log("Profile Screen - User Data:", {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
        givenName: user.user_metadata?.givenName,
        familyName: user.user_metadata?.familyName
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      if (!user) throw new Error("No user found");

      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) throw error;

      Alert.alert("Success", "Profile updated successfully!");
      setIsEditModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotificationSettings = async () => {
    try {
      setLoading(true);
      if (!user) throw new Error("No user found");

      const { error } = await supabase.auth.updateUser({
        data: { notification_settings: notificationSettings }
      });

      if (error) throw error;

      Alert.alert("Success", "Notification settings updated successfully!");
      setIsNotificationsModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update notification settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:aaronhubhachen@gmail.com');
  };

  const handleOpenFAQ = () => {
    // You can either navigate to a FAQ page or show a modal with FAQ content
    Alert.alert(
      "Frequently Asked Questions",
      "1. How do I start journaling?\n\n" +
      "Simply tap the record button on the home screen and start speaking. Your voice will be transcribed into text.\n\n" +
      "2. How do I view my past entries?\n\n" +
      "Go to the History tab to see all your past journal entries organized by date.\n\n" +
      "3. How do I change my profile picture?\n\n" +
      "Your profile picture is automatically synced with your Apple ID. To change it, update your Apple ID profile picture.\n\n" +
      "4. How do I enable notifications?\n\n" +
      "Go to Settings > Notifications to customize your notification preferences.",
      [{ text: "OK" }]
    );
  };

  const handleOpenPrivacyPolicy = () => {
    Alert.alert(
      "Privacy Policy",
      "Last updated: March 2024\n\n" +
      "1. Data Collection\n" +
      "We collect your journal entries and profile information to provide you with a personalized journaling experience.\n\n" +
      "2. Data Storage\n" +
      "Your data is securely stored using Supabase. We use encryption to protect your information.\n\n" +
      "3. Data Usage\n" +
      "Your journal entries are used to:\n" +
      "- Generate insights and mood tracking\n" +
      "- Provide personalized recommendations\n" +
      "- Improve our services\n\n" +
      "4. Data Protection\n" +
      "We implement security measures to protect your data and never share it with third parties.\n\n" +
      "5. Your Rights\n" +
      "You can access, update, or delete your data at any time through the app settings.",
      [{ text: "OK" }]
    );
  };

  const handleOpenTerms = () => {
    Alert.alert(
      "Terms of Service",
      "Last updated: March 2024\n\n" +
      "1. Acceptance of Terms\n" +
      "By using this app, you agree to these terms and conditions.\n\n" +
      "2. User Responsibilities\n" +
      "- You must be at least 13 years old\n" +
      "- You are responsible for maintaining your account security\n" +
      "- You agree not to misuse or abuse the service\n\n" +
      "3. Content Guidelines\n" +
      "- Your journal entries must be your own content\n" +
      "- No harmful, illegal, or inappropriate content\n" +
      "- We reserve the right to remove content that violates these guidelines\n\n" +
      "4. Service Modifications\n" +
      "We may update or modify the service at any time.\n\n" +
      "5. Limitation of Liability\n" +
      "We are not liable for any damages arising from your use of the service.",
      [{ text: "OK" }]
    );
  };

  // Get user's name or fallback to email
  const displayName = user?.user_metadata?.givenName || 
    user?.email?.split("@")[0] || 
    "User";

  // Get initials from first name
  const initials = user?.user_metadata?.givenName?.[0]?.toUpperCase() || "U";

  return (
    <ScrollView className="flex-1">
      <LinearGradient
        colors={["#FFA500", "#FFFFFF"]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View className="pt-16 pb-8">
          <View className="items-center">
            {user?.user_metadata?.picture ? (
              <Image
                source={{ uri: user.user_metadata.picture }}
                className="w-32 h-32 rounded-full border-4 border-white"
              />
            ) : (
              <View className="w-32 h-32 rounded-full border-4 border-white bg-orange-500 items-center justify-center">
                <Text className="text-4xl font-bold text-white">{initials}</Text>
              </View>
            )}
            <Text className="text-2xl font-bold text-white mt-4">
              {displayName}
              {user?.user_metadata?.familyName && ` ${user.user_metadata.familyName}`}
            </Text>
            <Text className="text-white/80">{user?.email}</Text>
          </View>
        </View>

        <View className="px-4 py-6">
          <View className="bg-white rounded-2xl shadow-sm">
            <TouchableOpacity 
              className="flex-row items-center p-4 border-b border-gray-100"
              onPress={() => setIsEditModalVisible(true)}
            >
              <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
                <FontAwesome name="user" size={20} color="#FFA500" />
              </View>
              <Text className="text-lg text-gray-800">Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-4 border-b border-gray-100"
              onPress={() => setIsNotificationsModalVisible(true)}
            >
              <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
                <FontAwesome name="bell" size={20} color="#FFA500" />
              </View>
              <Text className="text-lg text-gray-800">Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-4 border-b border-gray-100"
              onPress={() => setIsHelpModalVisible(true)}
            >
              <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
                <FontAwesome name="question-circle" size={20} color="#FFA500" />
              </View>
              <Text className="text-lg text-gray-800">Help & Support</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center p-4"
              onPress={handleSignOut}
            >
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
                <FontAwesome name="sign-out" size={20} color="#EF4444" />
              </View>
              <Text className="text-lg text-red-500">Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Edit Profile Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isEditModalVisible}
          onRequestClose={() => setIsEditModalVisible(false)}
        >
          <View className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-gray-800">Edit Profile</Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <FontAwesome name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-gray-600 mb-2">Full Name</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 text-gray-800"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#666"
                  />
                </View>

                <View>
                  <Text className="text-gray-600 mb-2">Email</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-gray-50"
                    value={user?.email || ""}
                    editable={false}
                  />
                </View>

                <TouchableOpacity
                  className="bg-orange-500 rounded-lg p-4 mt-4"
                  onPress={handleUpdateProfile}
                  disabled={loading}
                >
                  <Text className="text-white text-center font-semibold">
                    {loading ? "Updating..." : "Save Changes"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Notifications Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isNotificationsModalVisible}
          onRequestClose={() => setIsNotificationsModalVisible(false)}
        >
          <View className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-gray-800">Notification Settings</Text>
                <TouchableOpacity onPress={() => setIsNotificationsModalVisible(false)}>
                  <FontAwesome name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View className="space-y-6">
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-lg text-gray-800">Daily Reminder</Text>
                    <Text className="text-sm text-gray-500">Get reminded to journal each day</Text>
                  </View>
                  <Switch
                    value={notificationSettings.dailyReminder}
                    onValueChange={(value) => 
                      setNotificationSettings(prev => ({ ...prev, dailyReminder: value }))
                    }
                    trackColor={{ false: "#767577", true: "#FFA500" }}
                    thumbColor={notificationSettings.dailyReminder ? "#fff" : "#f4f3f4"}
                  />
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-lg text-gray-800">Weekly Insights</Text>
                    <Text className="text-sm text-gray-500">Receive weekly summaries of your journal entries</Text>
                  </View>
                  <Switch
                    value={notificationSettings.weeklyInsights}
                    onValueChange={(value) => 
                      setNotificationSettings(prev => ({ ...prev, weeklyInsights: value }))
                    }
                    trackColor={{ false: "#767577", true: "#FFA500" }}
                    thumbColor={notificationSettings.weeklyInsights ? "#fff" : "#f4f3f4"}
                  />
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-lg text-gray-800">Mood Tracking</Text>
                    <Text className="text-sm text-gray-500">Get insights about your mood patterns</Text>
                  </View>
                  <Switch
                    value={notificationSettings.moodTracking}
                    onValueChange={(value) => 
                      setNotificationSettings(prev => ({ ...prev, moodTracking: value }))
                    }
                    trackColor={{ false: "#767577", true: "#FFA500" }}
                    thumbColor={notificationSettings.moodTracking ? "#fff" : "#f4f3f4"}
                  />
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-lg text-gray-800">New Features</Text>
                    <Text className="text-sm text-gray-500">Stay updated about new app features</Text>
                  </View>
                  <Switch
                    value={notificationSettings.newFeatures}
                    onValueChange={(value) => 
                      setNotificationSettings(prev => ({ ...prev, newFeatures: value }))
                    }
                    trackColor={{ false: "#767577", true: "#FFA500" }}
                    thumbColor={notificationSettings.newFeatures ? "#fff" : "#f4f3f4"}
                  />
                </View>

                <TouchableOpacity
                  className="bg-orange-500 rounded-lg p-4 mt-4"
                  onPress={handleUpdateNotificationSettings}
                  disabled={loading}
                >
                  <Text className="text-white text-center font-semibold">
                    {loading ? "Updating..." : "Save Settings"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Help & Support Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isHelpModalVisible}
          onRequestClose={() => setIsHelpModalVisible(false)}
        >
          <View className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-gray-800">Help & Support</Text>
                <TouchableOpacity onPress={() => setIsHelpModalVisible(false)}>
                  <FontAwesome name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                <TouchableOpacity 
                  className="flex-row items-center p-4 bg-orange-50 rounded-lg"
                  onPress={handleOpenFAQ}
                >
                  <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
                    <FontAwesome name="question-circle" size={20} color="#FFA500" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg text-gray-800">Frequently Asked Questions</Text>
                    <Text className="text-sm text-gray-500">Find answers to common questions</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity 
                  className="flex-row items-center p-4 bg-orange-50 rounded-lg"
                  onPress={handleContactSupport}
                >
                  <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
                    <FontAwesome name="envelope" size={20} color="#FFA500" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg text-gray-800">Contact Support</Text>
                    <Text className="text-sm text-gray-500">Get help from our support team</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity 
                  className="flex-row items-center p-4 bg-orange-50 rounded-lg"
                  onPress={handleOpenPrivacyPolicy}
                >
                  <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
                    <FontAwesome name="shield" size={20} color="#FFA500" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg text-gray-800">Privacy Policy</Text>
                    <Text className="text-sm text-gray-500">Learn about our data practices</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity 
                  className="flex-row items-center p-4 bg-orange-50 rounded-lg"
                  onPress={handleOpenTerms}
                >
                  <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
                    <FontAwesome name="file-text" size={20} color="#FFA500" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg text-gray-800">Terms of Service</Text>
                    <Text className="text-sm text-gray-500">Read our terms and conditions</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </ScrollView>
  );
} 