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
import { init, getAllLogs, insertLog, calculateStreak } from "../../src/db/database";
import { useFocusEffect } from "expo-router";

function fmtDate(d = new Date()) {
  return d.toISOString().split("T")[0];
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
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [w, setW] = useState("");
  const [bf, setBf] = useState("");
  const [mm, setMm] = useState("");
  const [busy, setBusy] = useState(false);

  const clear = () => {
    setW("");
    setBf("");
    setMm("");
  };

  const save = async () => {
    if (!w || !bf || !mm) {
      Alert.alert("Fill all fields");
      return;
    }
    Keyboard.dismiss();
    setBusy(true);
    try {
      const today = fmtDate();
      const rows = await getAllLogs();
      if (rows.find((r: any) => r.date === today)) {
        Alert.alert("Already logged today");
        setBusy(false);
        return;
      }
      await insertLog(today, parseFloat(w), parseFloat(bf), parseFloat(mm));
      clear();
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert("Save failed");
      console.log("LOG_SAVE_ERR", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
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
            style={{ color: "#EAEAEA", borderBottomWidth: 1, borderBottomColor: "#444", marginTop: 20 }}
          />

          <TextInput
            placeholder="Body fat %"
            placeholderTextColor="#777"
            value={bf}
            onChangeText={setBf}
            keyboardType="decimal-pad"
            style={{ color: "#EAEAEA", borderBottomWidth: 1, borderBottomColor: "#444", marginTop: 20 }}
          />

          <TextInput
            placeholder="Muscle mass"
            placeholderTextColor="#777"
            value={mm}
            onChangeText={setMm}
            keyboardType="decimal-pad"
            style={{ color: "#EAEAEA", borderBottomWidth: 1, borderBottomColor: "#444", marginTop: 20 }}
          />

          <Pressable
            onPress={save}
            disabled={busy}
            style={{
              marginTop: 30,
              backgroundColor: busy ? "#2aa36a" : "#4ADE80",
              paddingVertical: 14,
              borderRadius: 8,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#0F0F0F" />
            ) : (
              <Text style={{ textAlign: "center", color: "#0F0F0F", fontSize: 16, fontWeight: "600" }}>Save</Text>
            )}
          </Pressable>

          <Pressable onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={{ color: "#888", textAlign: "center" }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function Home() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const rows = await getAllLogs();
      setCount(rows.length);
      setStreak(calculateStreak(rows));
    } catch (e) {
      console.log("REFRESH_ERR", e);
    }
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
        <Text style={{ color: "#EAEAEA", fontSize: 26 }}>Locked In 🔒</Text>

        <Text style={{ color: "#EAEAEA", fontSize: 18, marginTop: 8 }}>
          Streak: {streak} day{streak === 1 ? "" : "s"}
        </Text>

        <Text style={{ color: "#4ADE80", fontSize: 20, marginTop: 16 }}>Days logged: {count}</Text>

        {loading ? <ActivityIndicator style={{ marginTop: 12 }} color="#4ADE80" /> : null}
      </View>

      <Fab onPress={() => setOpen(true)} />

      <LogModal
        visible={open}
        onClose={() => setOpen(false)}
        onSaved={() => {
          refresh();
        }}
      />
    </View>
  );
}
