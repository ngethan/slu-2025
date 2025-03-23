import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  AppState,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import * as AppleAuthentication from "expo-apple-authentication";
import { LinearGradient } from "expo-linear-gradient";
import { verifyInstallation } from "nativewind";

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const { user } = data;
        console.log(user);
        if (user.email_confirmed_at) {
          router.replace("/(tabs)/home");
        }
      }
    };
    checkUser();
  }, []);

  async function signInWithEmail() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user?.email_confirmed_at) {
        // Create or get existing conversation
        const { data: conversationData, error: conversationError } =
          await supabase
            .from("conversations")
            .insert([
              {
                userId: data.user.id,
                chatName: "New Chat",
                lastDate: new Date().toISOString(),
              },
            ])
            .select()
            .single();

        if (conversationError) throw conversationError;

        // Route to the conversation page
        router.replace(`/(tabs)/${conversationData.id}`);
      } else {
        Alert.alert("Check Email", "Verify your email before signing in.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function signUpWithEmail() {
    setLoading(true);

    try {
      // ✅ Step 1: Sign up user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) throw error;

      Alert.alert("Please check your inbox for email verification!");

      // ✅ Step 2: Wait for user to confirm email
      const checkEmailVerified = async () => {
        let attempts = 0;
        const interval = setInterval(async () => {
          if (attempts >= 10) {
            clearInterval(interval);
            setLoading(false);
            return;
          }

          const { data: userData, error: userError } =
            await supabase.auth.getUser();
          if (userError) {
            clearInterval(interval);
            setLoading(false);
            return;
          }

          if (userData?.user?.email_confirmed_at) {
            clearInterval(interval);

            // ✅ Step 3: Insert user into DB after verification
            await supabase
              .from("users")
              .insert([{ id: userData.user.id, email, full_name: fullName }]);

            // ✅ Step 4: Create initial conversation
            const { data: conversationData, error: conversationError } =
              await supabase
                .from("conversations")
                .insert([
                  {
                    userId: userData.user.id,
                    chatName: "New Chat",
                    lastDate: new Date().toISOString(),
                  },
                ])
                .select()
                .single();

            if (conversationError) throw conversationError;

            setLoading(false);
            // Route to the new conversation
            router.replace(`/(tabs)/${conversationData.id}`);
          }
          attempts++;
        }, 5000); // Reduced from 500000 to 5000 (5 seconds)
      };

      checkEmailVerified();
    } catch (error: any) {
      Alert.alert("Error", error.message);
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email)
      return Alert.alert("Error", "Enter your email to reset password");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Success", "Password reset email sent!");
    setLoading(false);
  }

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken!,
      });

      if (error) throw error;

      if (data.user) {
        // If this is first time sign in, save user data
        const { data: existingUser } = await supabase
          .from("users")
          .select()
          .eq("id", data.user.id)
          .single();

        if (!existingUser) {
          await supabase.from("users").insert([
            {
              id: data.user.id,
              email: credential.email,
              full_name: credential.fullName?.givenName
                ? `${credential.fullName.givenName} ${credential.fullName.familyName || ""}`
                : null,
            },
          ]);
        }

        // Create or get existing conversation
        const { data: conversationData, error: conversationError } =
          await supabase
            .from("conversations")
            .insert([
              {
                userId: data.user.id,
                chatName: "New Chat",
                lastDate: new Date().toISOString(),
              },
            ])
            .select()
            .single();

        if (conversationError) throw conversationError;

        router.replace(`/(tabs)/${conversationData.id}`);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  verifyInstallation();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={["#e0c3fc", "#8ec5fc"]}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-full max-w-md bg-white/95 rounded-2xl p-6 shadow-lg">
          <Text className="text-3xl font-bold text-gray-800 text-center mb-5">
            {isSignUp ? "Create Account" : "Sign In"}
          </Text>

          {isSignUp && (
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#666"
              value={fullName}
              autoCapitalize="words"
              onChangeText={setFullName}
              className="h-12 border border-gray-300 rounded-lg px-4 bg-white text-base text-gray-800 mb-4"
            />
          )}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            className="h-12 border border-gray-300 rounded-lg px-4 bg-white text-base text-gray-800 mb-4"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            autoCapitalize="none"
            onChangeText={setPassword}
            className="h-12 border border-gray-300 rounded-lg px-4 bg-white text-base text-gray-800 mb-4"
          />

          <TouchableOpacity
            disabled={loading}
            onPress={isSignUp ? signUpWithEmail : signInWithEmail}
            className="w-full p-3 rounded-lg mt-2 bg-indigo-600 shadow-lg items-center"
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-lg font-bold text-white">
                {isSignUp ? "Sign Up" : "Sign In"}
              </Text>
            )}
          </TouchableOpacity>

          <View className="w-full mt-5 items-center">
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={5}
              style={{ width: "100%", height: 44 }}
              onPress={handleAppleSignIn}
            />
          </View>

          {!isSignUp && (
            <TouchableOpacity onPress={resetPassword} className="mt-3">
              <Text className="text-indigo-600 underline text-center">
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}

          {/* Switch Between Sign In & Sign Up */}
          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            className="mt-5"
          >
            <Text className="text-base text-gray-800 text-center">
              {isSignUp ? "Already have an account? " : "Not a member? "}
              <Text className="font-bold text-indigo-600">
                {isSignUp ? "Sign in" : "Create an account"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
