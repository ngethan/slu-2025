import React, { useEffect, useRef } from "react";
import { View, Animated, Text, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "@/lib/supabase";
import { AuthError } from "@supabase/supabase-js";

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleAppleSignIn = async () => {
    try {
      try {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (credential.identityToken) {
          const {
            error,
            data: { user },
          } = await supabase.auth.signInWithIdToken({
            provider: "apple",
            token: credential.identityToken,
          });
          console.log(JSON.stringify({ error, user }, null, 2));
          if (!error && user) {
            const { error: upsertError } = await supabase
              .from("users")
              .update({
                fullName:
                  credential.fullName?.givenName &&
                  credential.fullName?.familyName
                    ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
                    : null,
              })
              .eq("id", user.id);

            if (upsertError) throw new Error("Couldn't update user");

            console.log("Apple sign-in successful:", credential);
            router.replace("/(tabs)/conversation/new");
          }
        } else {
          throw new Error("No identityToken.");
        }
      } catch (e) {
        if ((e as AuthError).code === "ERR_REQUEST_CANCELED") {
        } else {
          console.error(e);
        }
      }
    } catch (e: any) {
      if (e.code === "ERR_REQUEST_CANCELED") {
        console.log("User canceled Apple sign-in");
      } else {
        console.error("Apple sign-in error:", e);
      }
    }
  };

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={["#FFF9F0", "#FFE4BC"]}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      <View className="flex-1 justify-center items-center px-6">
        <View className="items-center">
          <Animated.View
            style={{
              opacity: fadeAnim,
            }}
          >
            <Ionicons name="mic-circle" size={80} color="#FF9500" />
          </Animated.View>

          <Animated.Text
            style={{ opacity: fadeAnim }}
            className="text-[#1C1C1E] text-5xl font-bold mt-4"
          >
            murmur
          </Animated.Text>
          <Animated.Text
            style={{ opacity: fadeAnim }}
            className="text-[#666666] text-lg font-medium mt-3 text-center"
          >
            Speak your mind, find your clarity
          </Animated.Text>
        </View>

        <Animated.View
          style={{ opacity: fadeAnim }}
          className="mt-12 space-y-4"
        >
          <View className="flex-row items-center space-x-3">
            <Ionicons name="mic-outline" size={24} color="#FF9500" />
            <Text className="text-[#1C1C1E] text-lg">
              Voice-first journaling
            </Text>
          </View>
          <View className="flex-row items-center space-x-3">
            <Ionicons name="help-circle-outline" size={24} color="#FF9500" />
            <Text className="text-[#1C1C1E] text-lg">
              Guided self-reflection
            </Text>
          </View>
          <View className="flex-row items-center space-x-3">
            <Ionicons name="bulb-outline" size={24} color="#FF9500" />
            <Text className="text-[#1C1C1E] text-lg">AI-powered insights</Text>
          </View>
        </Animated.View>

        <View className="absolute bottom-12 w-full px-6">
          {Platform.OS === "ios" ? (
            <>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={25}
                style={{
                  width: "100%",
                  height: 56,
                }}
                onPress={handleAppleSignIn}
              />
              <Link href="/(tabs)/conversation/271ab9e1-ab9c-4768-8a82-e52b868b5b67">
                just bring me to home
              </Link>
            </>
          ) : (
            <Text className="text-center text-gray-500">
              Apple Sign In is only available on iOS devices
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
