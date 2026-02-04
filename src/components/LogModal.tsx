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
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { insertLog, updateLog } from "../db/database"; 
import { savePhoto } from "../utils/photos";

function fmtDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  existingLog?: any | null; // If provided, we are in "Edit Mode"
};

export default function LogModal({ visible, onClose, onSaved, existingLog }: Props) {
  const [w, setW] = useState("");
  const [bf, setBf] = useState("");
  const [mm, setMm] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      if (existingLog) {
        // PRE-FILL DATA FOR EDITING
        setW(String(existingLog.weight || ""));
        setBf(String(existingLog.bodyFat || ""));
        setMm(String(existingLog.muscleMass || ""));
        try {
            const p = typeof existingLog.photos === 'string' ? JSON.parse(existingLog.photos) : existingLog.photos;
            setPhotos(Array.isArray(p) ? p : []);
        } catch {
            setPhotos([]);
        }
      } else {
        // RESET FOR NEW LOG
        setW("");
        setBf("");
        setMm("");
        setPhotos([]);
      }
    }
  }, [visible, existingLog]);

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

  const save = async () => {
    if (!w || !bf || !mm) {
      Alert.alert("Fill all fields");
      return;
    }

    Keyboard.dismiss();
    setBusy(true);

    try {
      // Use existing date if editing, otherwise use today's date
      const dateToSave = existingLog?.date || fmtDate();
      
      const savedPhotos: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        // If photo is already saved (starts with file://.../logs/), keep it
        if (photos[i].includes("logs/")) {
             savedPhotos.push(photos[i]);
        } else {
             const path = await savePhoto(dateToSave, photos[i], i);
             savedPhotos.push(path);
        }
      }

      if (existingLog) {
        await updateLog(dateToSave, parseFloat(w), parseFloat(bf), parseFloat(mm), savedPhotos);
      } else {
        await insertLog(dateToSave, parseFloat(w), parseFloat(bf), parseFloat(mm), savedPhotos);
      }

      onSaved(); 
      onClose(); 
    } catch (e) {
      Alert.alert("Save failed");
      console.log(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#0F0F0F", padding: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <Text style={{ color: "#EAEAEA", fontSize: 22 }}>
            {existingLog ? `Edit Log (${existingLog.date})` : "Log Today"}
          </Text>

          <TextInput placeholder="Weight (kg)" placeholderTextColor="#777" value={w} onChangeText={setW} keyboardType="decimal-pad" style={{ color: "#EAEAEA", borderBottomWidth: 1, borderBottomColor: "#444", marginTop: 20 }} />
          <TextInput placeholder="Body fat %" placeholderTextColor="#777" value={bf} onChangeText={setBf} keyboardType="decimal-pad" style={{ color: "#EAEAEA", borderBottomWidth: 1, borderBottomColor: "#444", marginTop: 20 }} />
          <TextInput placeholder="Muscle mass" placeholderTextColor="#777" value={mm} onChangeText={setMm} keyboardType="decimal-pad" style={{ color: "#EAEAEA", borderBottomWidth: 1, borderBottomColor: "#444", marginTop: 20 }} />
          
          <Pressable onPress={pickPhoto} style={{ marginTop: 20 }}>
            <Text style={{ color: "#4ADE80" }}>+ Add Photo ({photos.length}/3)</Text>
          </Pressable>

          <View style={{ flexDirection: "row", marginTop: 10 }}>
            {photos.map((_, i) => (
              <Text key={i} style={{ color: "#888", marginRight: 8 }}>📷 {i + 1}</Text>
            ))}
          </View>

          <Pressable onPress={save} disabled={busy} style={{ marginTop: 30, backgroundColor: "#4ADE80", paddingVertical: 14, borderRadius: 8 }}>
            {busy ? <ActivityIndicator color="#0F0F0F" /> : <Text style={{ textAlign: "center", color: "#0F0F0F", fontSize: 16, fontWeight: "600" }}>Save</Text>}
          </Pressable>

          <Pressable onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={{ color: "#888", textAlign: "center" }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}