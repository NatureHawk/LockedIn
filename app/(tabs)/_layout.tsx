// File: app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hides the top header
        tabBarStyle: {
          backgroundColor: "#1A1A1A", // Dark grey background for the tab bar
          borderTopColor: "#333",     // Subtle top border
          height: 60,                 // Taller bar for easier tapping
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#4ADE80", // Green when selected
        tabBarInactiveTintColor: "#888",  // Grey when not selected
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      {/* 1. HOME TAB */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />

      {/* 2. WORKOUTS TAB */}
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="fitness-center" size={24} color={color} />
          ),
        }}
      />

      {/* 3. HISTORY TAB */}
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}