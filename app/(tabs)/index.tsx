import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { init, getAllLogs, calculateStreak, getDayState, DayState } from "../../src/db/database";
import { useFocusEffect } from "expo-router";
// ✅ IMPORT THE SHARED MODAL (Instead of defining it here)
import LogModal from "../../src/components/LogModal"; 
import ConsistencyGrid from "../../src/components/ConsistencyGrid";

function fmtDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Fab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        bottom: 30,
        alignSelf: "center",
        backgroundColor: "#4ADE80",
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        elevation: 6,
      }}
    >
      <Text style={{ fontSize: 36, color: "#0F0F0F", marginBottom: 4 }}>+</Text>
    </Pressable>
  );
}

export default function Home() {
  const [count, setCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dayState, setDayState] = useState<DayState>("no_logs_yet");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State for logs
  const [todayLog, setTodayLog] = useState<any | null>(null);
  const [allLogs, setAllLogs] = useState<any[]>([]);

  const dayStatusText = (() => {
    if (dayState === "locked_today") return "Locked in today 🔒";
    if (dayState === "on_streak") return `On a ${streak}-day streak`;
    if (dayState === "missed_yesterday") return "Missed yesterday — streak reset";
    if (dayState === "no_logs_yet") return "Start your first day";
    return "";
  })();

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

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F0F" }}>
      <View style={{ padding: 24 }}>
        <Text style={{ color: "#EAEAEA", fontSize: 18, marginTop: 8 }}>
          {dayStatusText}
        </Text>

        {dayState === "missed_yesterday" && (
          <Text style={{ color: "#F87171", marginTop: 4 }}>
            Consistency broke — restart today
          </Text>
        )}

        <Text style={{ color: "#4ADE80", fontSize: 20, marginTop: 16 }}>
          Days logged: {count}
        </Text>
        {loading && (
          <ActivityIndicator style={{ marginTop: 12 }} color="#4ADE80" />
        )}
      </View>

      <View style={{ marginTop: 32, alignItems: "center" }}>
        <Text style={{ color: "#888", marginBottom: 12, fontSize: 12 }}>
          LAST 100 DAYS
        </Text>
        <ConsistencyGrid logs={allLogs} />
      </View>
      
      <Fab onPress={() => setOpen(true)} />

      {/* ✅ USING THE IMPORTED MODAL */}
      <LogModal
        visible={open}
        onClose={() => setOpen(false)}
        onSaved={refresh}
        existingLog={todayLog} // Note: Prop name is 'existingLog' in the new component
      />
    </View>
  );
}