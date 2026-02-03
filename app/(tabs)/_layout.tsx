import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#0F0F0F" },
        tabBarActiveTintColor: "#4ADE80",
        sceneContainerStyle: { backgroundColor: "#0F0F0F" },
      }}
    ><Tabs.Screen name="index" options={{ title: "Home" }} />
<Tabs.Screen name="history" options={{ title: "History" }} />

    </Tabs>
  );
}
