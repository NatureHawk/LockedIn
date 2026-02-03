import {
  View,
  Text,
  ScrollView,
  Modal,
  Image,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { Picker } from "@react-native-picker/picker";
import { getAllLogs, init } from "../../src/db/database";
import HistoryCard from "../../src/components/HistoryCard";
// ✅ VERIFIED PATH: Points correctly to your src/charts folder
import MetricChart from "../../src/charts/MetricChart"; 
import { useFocusEffect } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function History() {
  const [mode, setMode] = useState<"weight" | "fat" | "muscle" | "all">("weight");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView | null>(null);

  // Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotos, setViewerPhotos] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (photos: string[], index = 0) => {
    if (!photos || photos.length === 0) return;
    setViewerPhotos(photos);
    setViewerIndex(index);
    setViewerOpen(true);
  };

  // Scroll to correct photo index when viewer opens
  useEffect(() => {
    if (viewerOpen) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          x: width * viewerIndex,
          animated: false,
        });
      });
    }
  }, [viewerOpen]);

  const load = async () => {
    try {
      const rows = await getAllLogs();
      
      // ✅ SORTING: Charts need data sorted by date (Oldest -> Newest)
      const sorted = rows.sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setData(
        sorted.map((r: any) => ({
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
    } catch (e) {
      console.log(e);
    }
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
      <View style={styles.centerContainer}>
        <Text style={{ color: "#888" }}>Loading history…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>History</Text>

      <View style={styles.pickerContainer}>
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
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        
        {/* ✅ CHART SECTION: Only shows if you have more than 1 log */}
        {data.length > 1 ? (
          <View style={{ marginBottom: 24, marginTop: 8 }}>
            <MetricChart data={data} mode={mode} />
          </View>
        ) : (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: "#555" }}>Log more days to see the chart</Text>
          </View>
        )}

        {/* ✅ LIST SECTION: Reversed so Newest is at the top */}
        {data.slice().reverse().map((item: any) => ( 
          <HistoryCard
            key={item.date}
            date={item.date}
            weight={item.weight}
            bodyFat={item.bodyFat}
            muscleMass={item.muscleMass}
            photos={item.photos}
            onPressPhoto={(i) => openViewer(item.photos, i)}
          />
        ))}
      </ScrollView>

      {/* PHOTO VIEWER MODAL */}
      <Modal
        visible={viewerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewerOpen(false)}
      >
        <View style={styles.modalBackground}>
          {/* Backdrop Tap */}
          <Pressable
            onPress={() => setViewerOpen(false)}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.viewerContainer} pointerEvents="box-none">
            <View style={{ marginTop: 12, alignItems: 'center' }}>
               <Text style={{ color: "#AAA", fontSize: 12 }}>Tap outside image to close</Text>
            </View>
            
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {viewerPhotos.map((uri, index) => (
                <Pressable
                  key={index}
                  style={{ width, height, justifyContent: "center", alignItems: "center" }}
                  onPress={() => setViewerOpen(false)}
                >
                  <Pressable activeOpacity={1} style={styles.imageWrapper}>
                    <Image
                      source={{ uri }}
                      style={styles.fullImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#EAEAEA",
    fontSize: 22,
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 10,
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    overflow: "hidden",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  viewerContainer: {
    flex: 1,
    justifyContent: "center",
  },
  imageWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  fullImage: {
    width: width * 0.95,
    height: height * 0.8,
    borderRadius: 8,
  },
});