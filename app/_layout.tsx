// File: app/_layout.tsx

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { init } from "../src/db/database"; // Make sure this path is correct for your project

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // 1. Initialize Database immediately on launch
    init()
      .then(() => {
        console.log("Database initialized!");
        setDbReady(true);
      })
      .catch((e) => {
        console.error("DB Init Error:", e);
      });
  }, []);

  // 2. Show loading screen while DB is setting up
  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0F0F", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4ADE80" />
        <Text style={{ color: "#888", marginTop: 20 }}>Starting LockedIn...</Text>
      </View>
    );
  }

  // 3. Once DB is ready, load the app
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F0F0F" },
        }}
      />
    </GestureHandlerRootView>
  );
}