import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { init, getAllLogs, insertLog, calculateStreak, getDayState, DayState } from "../../src/db/database";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { savePhoto } from "../../src/utils/photos";

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

function LogModal({
  visible,
  onClose,
  onSaved,
  todayLog, // <--- Defined as a prop here
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  todayLog: any | null;
}) {
  const [w, setW] = useState("");
  const [bf, setBf] = useState("");
  const [mm, setMm] = useState("");
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  
  // ❌ DELETED: const [todayLog, setTodayLog] = useState... 
  // (This was causing the "already declared" error)

  // Optional: Pre-fill data if editing an existing log
  useEffect(() => {
    if (todayLog) {
      setW(String(todayLog.weight || ""));
      setBf(String(todayLog.bodyFat || ""));
      setMm(String(todayLog.muscleMass || ""));
      // Note: Photos logic would be more complex to pre-fill, skipped for now
    }
  }, [todayLog]);

  const pickPhoto = async () => {
    if (photos.length >= 3) {
      Alert.alert("Max 3 photos per day");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos((p) => [...p, result.assets[0].uri]);
    }
  };

  const clear = () => {
    setW("");
    setBf("");
    setMm("");
    setPhotos([]);
  };

  const close = () => {
    clear();
    onClose();
  };

  const save = async () => {
    if (!w || !bf || !mm) {
      Alert.alert("Fill all fields");
      return;
    }

    Keyboard.dismiss();
    setBusy(true);

    try {
      const date = fmtDate();
      const savedPhotos: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const path = await savePhoto(date, photos[i], i);
        savedPhotos.push(path);
      }

      await insertLog(
        date,
        parseFloat(w),
        parseFloat(bf),
        parseFloat(mm),
        savedPhotos
      );
      onSaved();
      close();
    } catch (e) {
      Alert.alert("Save failed");
      console.log(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#0F0F0F",
            padding: 24,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <Text style={{ color: "#EAEAEA", fontSize: 22 }}>Log Today</Text>

          <TextInput
            placeholder="Weight (kg)"
            placeholderTextColor="#777"
            value={w}
            onChangeText={setW}
            keyboardType="decimal-pad"
            style={{
              color: "#EAEAEA",
              borderBottomWidth: 1,
              borderBottomColor: "#444",
              marginTop: 20,
            }}
          />
          <TextInput
            placeholder="Body fat %"
            placeholderTextColor="#777"
            value={bf}
            onChangeText={setBf}
            keyboardType="decimal-pad"
            style={{
              color: "#EAEAEA",
              borderBottomWidth: 1,
              borderBottomColor: "#444",
              marginTop: 20,
            }}
          />
          <TextInput
            placeholder="Muscle mass"
            placeholderTextColor="#777"
            value={mm}
            onChangeText={setMm}
            keyboardType="decimal-pad"
            style={{
              color: "#EAEAEA",
              borderBottomWidth: 1,
              borderBottomColor: "#444",
              marginTop: 20,
            }}
          />
          <Pressable onPress={pickPhoto} style={{ marginTop: 20 }}>
            <Text style={{ color: "#4ADE80" }}>
              + Add Photo ({photos.length}/3)
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", marginTop: 10 }}>
            {photos.map((_, i) => (
              <Text key={i} style={{ color: "#888", marginRight: 8 }}>
                📷 {i + 1}
              </Text>
            ))}
          </View>

          <Pressable
            onPress={save}
            disabled={busy}
            style={{
              marginTop: 30,
              backgroundColor: "#4ADE80",
              paddingVertical: 14,
              borderRadius: 8,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#0F0F0F" />
            ) : (
              <Text
                style={{
                  textAlign: "center",
                  color: "#0F0F0F",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Save
              </Text>
            )}
          </Pressable>

          <Pressable onPress={close} style={{ marginTop: 12 }}>
            <Text style={{ color: "#888", textAlign: "center" }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function Home() {
  const [count, setCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dayState, setDayState] = useState<DayState>("no_logs_yet");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // ✅ ADDED: Missing state for todayLog
  const [todayLog, setTodayLog] = useState<any | null>(null);

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

      <Fab onPress={() => setOpen(true)} />

      <LogModal
        visible={open}
        onClose={() => setOpen(false)}
        onSaved={refresh}
        todayLog={todayLog}
      />
    </View>
  );
}