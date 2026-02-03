import {
  View,
  Text,
  ScrollView,
  Modal,
  Image,
  Pressable,
  Dimensions,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { Picker } from "@react-native-picker/picker";
import { getAllLogs, init } from "../../src/db/database";
import HistoryCard from "../../src/components/HistoryCard";
import { useFocusEffect } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function History() {
  const [mode, setMode] = useState<"weight" | "fat" | "muscle" | "all">("weight");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotos, setViewerPhotos] = useState<string[]>([]);

  const openViewer = (photos: string[]) => {
    if (!photos || photos.length === 0) return;
    setViewerPhotos(photos);
    setViewerOpen(true);
  };

  const load = async () => {
    const rows = await getAllLogs();
    setData(
      rows.map((r: any) => ({
        ...r,
        photos:
          typeof r.photos === "string"
            ? (() => {
                try {
                  return JSON.parse(r.photos);
                } catch {
                  return [];
                }
              })()
            : [],
      }))
    );
  };

  useEffect(() => {
    (async () => {
      await init();
      await load();
      setLoading(false);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0F0F0F",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#888" }}>Loading history…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F0F", padding: 16 }}>
      <Text style={{ color: "#EAEAEA", fontSize: 22, marginBottom: 12 }}>
        History
      </Text>

      <Picker
        selectedValue={mode}
        onValueChange={setMode}
        dropdownIconColor="#EAEAEA"
        style={{ color: "#EAEAEA", backgroundColor: "#1A1A1A" }}
      >
        <Picker.Item label="Weight" value="weight" />
        <Picker.Item label="Body Fat %" value="fat" />
        <Picker.Item label="Muscle Mass" value="muscle" />
        <Picker.Item label="All" value="all" />
      </Picker>

      {/* ✅ THIS IS THE ONLY SCROLLVIEW IN THE MAIN SCREEN */}
      <ScrollView style={{ flex: 1 }}>
        {data.map((item: any) => (
          <HistoryCard
            key={item.date}
            date={item.date}
            weight={item.weight}
            bodyFat={item.bodyFat}
            muscleMass={item.muscleMass}
            photos={item.photos}
            onPress={() => openViewer(item.photos)}
          />
        ))}
      </ScrollView>

      {/* ✅ PHOTO VIEWER LIVES ONLY IN MODAL */}
      {viewerOpen && (
        <Modal transparent animationType="fade">
  {/* Backdrop */}
  <Pressable
    onPress={() => setViewerOpen(false)}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.9)",
    }}
  />

  {/* Viewer content (NOT pressable) */}
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
    >
      {viewerPhotos.map((uri, i) => (
        <View
          key={i}
          style={{
            width,
            height: height * 0.8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={{ uri }}
            style={{
              width: width * 0.95,
              height: height * 0.7,
              borderRadius: 12,
            }}
            resizeMode="contain"
          />
        </View>
      ))}
    </ScrollView>

    <Text style={{ color: "#EAEAEA", marginTop: 20 }}>
      Swipe to view • Tap outside to close
    </Text>
  </View>
</Modal>

      )}
    </View>
  );
}
