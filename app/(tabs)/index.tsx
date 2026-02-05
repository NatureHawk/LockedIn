import { View, Text, Pressable, ActivityIndicator, ScrollView, Dimensions } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { init, getAllLogs, calculateStreak, getDayState, DayState } from "../../src/db/database";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // <--- For the icons
import LogModal from "../../src/components/LogModal";
import ConsistencyGrid from "../../src/components/ConsistencyGrid";

const SCREEN_WIDTH = Dimensions.get("window").width;

function fmtDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 🎨 COMPONENT: A reusable "Stat Card" for the grid
function StatCard({ label, value, subtext, icon, color, activeColor }: any) {
  return (
    <View style={{ 
      backgroundColor: "#1A1A1A", 
      borderRadius: 20, 
      padding: 16, 
      flex: 1, 
      alignItems: "center", 
      justifyContent: "center",
      marginHorizontal: 6,
      // Subtle border for depth
      borderWidth: 1,
      borderColor: "#222"
    }}>
      <Ionicons name={icon} size={28} color={color} style={{ marginBottom: 8 }} />
      <Text style={{ color: "#FFF", fontSize: 24, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: "#888", fontSize: 12, marginTop: 4 }}>{label}</Text>
      {subtext ? <Text style={{ color: activeColor || "#555", fontSize: 10, marginTop: 2, fontWeight: '600' }}>{subtext}</Text> : null}
    </View>
  );
}

function Fab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        position: "absolute",
        bottom: 30,
        alignSelf: "center",
        backgroundColor: "#4ADE80",
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        elevation: 10,
        shadowColor: "#4ADE80",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        transform: [{ scale: pressed ? 0.95 : 1 }]
      })}
    >
      <Ionicons name="add" size={36} color="#0F0F0F" />
    </Pressable>
  );
}

export default function Home() {
  const [count, setCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dayState, setDayState] = useState<DayState>("no_logs_yet");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [todayLog, setTodayLog] = useState<any | null>(null);
  const [allLogs, setAllLogs] = useState<any[]>([]);

  const refresh = async () => {
    const rows = await getAllLogs();
    const today = fmtDate();
    const todayRow = rows.find((r: any) => r.date === today) || null;

    setAllLogs(rows);
    setCount(rows.length);  
    setStreak(calculateStreak(rows));
    setDayState(getDayState(rows));
    setTodayLog(todayRow);
  };

  useEffect(() => {
    (async () => {
      await init();
      await refresh();
      setLoading(false);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  // --- UI HELPERS ---
  const isLockedIn = dayState === "locked_today";
  const streakColor = streak > 0 ? "#FF5500" : "#333"; // Duolingo Orange for streak
  const statusColor = isLockedIn ? "#4ADE80" : (dayState === "missed_yesterday" ? "#F87171" : "#888");

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F0F" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* 1. HEADER */}
        <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 }}>
          <Text style={{ color: "#888", fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>
            {new Date().toDateString()}
          </Text>
          <Text style={{ color: "#EAEAEA", fontSize: 28, fontWeight: "800", marginTop: 4 }}>
            Stay Locked In.
          </Text>
        </View>

        {/* 2. HERO: BIG FLAME STREAK */}
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          {/* Animated-ish Flame Ring */}
          <View style={{
            width: 160, height: 160, borderRadius: 80,
            backgroundColor: "#1A1A1A",
            alignItems: "center", justifyContent: "center",
            borderWidth: 4, borderColor: streak > 0 ? "rgba(255, 85, 0, 0.2)" : "#222"
          }}>
            <Ionicons name="flame" size={80} color={streakColor} />
            <Text style={{ color: "#FFF", fontSize: 42, fontWeight: "900", marginTop: -10 }}>
              {streak}
            </Text>
          </View>
          <Text style={{ color: "#888", fontSize: 16, marginTop: 12, fontWeight: "600" }}>
            Day Streak
          </Text>
        </View>

        {/* 3. STAT CARDS ROW */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 30 }}>
          {/* Card 1: Total Days */}
          <StatCard 
            icon="calendar" 
            value={count} 
            label="Total Logs" 
            color="#4ADE80" 
          />
          
          {/* Card 2: Today's Status */}
          <StatCard 
            icon={isLockedIn ? "lock-closed" : "lock-open"} 
            value={isLockedIn ? "Done" : "Pending"} 
            label="Today's Status" 
            subtext={isLockedIn ? "Keep it up!" : "Log your day"}
            color={statusColor}
            activeColor={statusColor}
          />
        </View>

        {/* 4. CONSISTENCY GRID */}
        <View style={{ marginHorizontal: 20, backgroundColor: "#151515", padding: 20, borderRadius: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
             <Ionicons name="grid" size={16} color="#666" style={{ marginRight: 8 }} />
             <Text style={{ color: "#888", fontSize: 12, fontWeight: "bold", letterSpacing: 1 }}>
               CONSISTENCY MAP
             </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <ConsistencyGrid logs={allLogs} />
          </View>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <ActivityIndicator style={{ marginTop: 20 }} color="#4ADE80" />
        )}
      </ScrollView>

      {/* FAB */}
      <Fab onPress={() => setOpen(true)} />

      {/* MODAL */}
      <LogModal
        visible={open}
        onClose={() => setOpen(false)}
        onSaved={refresh}
        existingLog={todayLog}
      />
    </View>
  );
}