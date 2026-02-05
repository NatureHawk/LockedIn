import {
  View,
  Text,
  ScrollView,
  Modal,
  Image,
  Pressable,
  Dimensions,
  StyleSheet,
  Alert,
} from "react-native";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Picker } from "@react-native-picker/picker";
import { 
  getAllLogs, 
  init, 
  deleteLog, 
  saveSetting, 
  getSetting, 
  getAllWorkoutsArray, 
  deleteLog as deleteWorkoutLog, // Rename to avoid conflict if needed, though we track workouts differently
  WorkoutLog 
} from "../../src/db/database"; 
import HistoryCard from "../../src/components/HistoryCard";
import MetricChart from "../../src/charts/MetricChart"; 
import LogModal from "../../src/components/LogModal"; 
import GoalModal from "../../src/components/GoalModal"; 
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function History() {
  const [viewMode, setViewMode] = useState<"body" | "workout">("body");
  
  // Body Stats State
  const [metricMode, setMetricMode] = useState<"weight" | "fat" | "muscle" | "all">("weight");
  const [bodyData, setBodyData] = useState<any[]>([]);
  
  // Workout Stats State
  const [workoutData, setWorkoutData] = useState<WorkoutLog[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("All");
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView | null>(null);

  // Modals
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotos, setViewerPhotos] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [editLog, setEditLog] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [isGoalOpen, setIsGoalOpen] = useState(false);

  const load = async () => {
    try {
      // 1. Load Body Logs
      const logs = await getAllLogs();
      const sortedLogs = logs.sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setBodyData(
        sortedLogs.map((r: any) => ({
          ...r,
          photos: typeof r.photos === "string" 
            ? (() => { try { return JSON.parse(r.photos); } catch { return []; } })() 
            : [],
        }))
      );

      // 2. Load Workouts
      const workouts = await getAllWorkoutsArray();
      setWorkoutData(workouts);

      // Extract unique exercises
      const uniqueEx = Array.from(new Set(workouts.map((w: any) => w.exercise))).sort();
      // Add "All" option to the start
      setAvailableExercises(["All", ...uniqueEx]);
      
      // Default to "All" if nothing selected
      if (!selectedExercise) {
        setSelectedExercise("All");
      }

      // 3. Load Goal
      const savedGoal = await getSetting("target_weight");
      if (savedGoal) setTargetWeight(parseFloat(savedGoal));

    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  // --- HELPERS ---

  // Prepare Chart Data
  const chartData = useMemo(() => {
    if (viewMode === "body") {
      return bodyData;
    } else {
      if (selectedExercise === "All") return []; // No chart for "All"

      const relevantWorkouts = workoutData.filter(w => w.exercise === selectedExercise);
      return relevantWorkouts.map(w => {
        const maxLift = Math.max(...w.sets.map((s: any) => s.weight || 0));
        return {
          date: w.date,
          weight: maxLift,
          bodyFat: 0, 
          muscleMass: 0
        };
      });
    }
  }, [viewMode, bodyData, workoutData, selectedExercise, metricMode]);

  // Group Workouts by Date for the "All" view
  const groupedWorkouts = useMemo(() => {
    if (viewMode !== "workout" || selectedExercise !== "All") return [];

    const groups: { [key: string]: WorkoutLog[] } = {};
    workoutData.forEach(log => {
      if (!groups[log.date]) groups[log.date] = [];
      groups[log.date].push(log);
    });

    // Convert to array and sort by date descending (newest first)
    return Object.entries(groups)
      .map(([date, logs]) => ({ date, logs }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workoutData, viewMode, selectedExercise]);

  const openViewer = (photos: string[], index = 0) => {
    if (!photos || photos.length === 0) return;
    setViewerPhotos(photos);
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleLongPress = (item: any) => {
    Alert.alert("Manage Log", `Options for ${item.date}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Edit",
        onPress: () => {
          setEditLog(item);
          setIsEditOpen(true);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteLog(item.date);
          load();
        },
      },
    ]);
  };

  const saveGoal = async (val: string) => {
    if(val) {
      await saveSetting("target_weight", val);
      setTargetWeight(parseFloat(val));
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: "#888" }}>Loading history…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={styles.headerTitle}>History</Text>
        {viewMode === "body" && (
            <Pressable 
            onPress={() => setIsGoalOpen(true)}
            style={{ backgroundColor: '#1A1A1A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
            >
            <Text style={{ color: '#4ADE80', fontSize: 12, fontWeight: '600' }}>
                {targetWeight ? `Goal: ${targetWeight}kg` : "Set Goal"}
            </Text>
            </Pressable>
        )}
      </View>

      {/* DROPDOWNS */}
      <View style={styles.splitDropdownContainer}>
        <View style={[styles.pickerWrapper, { flex: 0.45 }]}>
            <Picker
                selectedValue={viewMode}
                onValueChange={(v) => setViewMode(v)}
                dropdownIconColor="#EAEAEA"
                style={styles.picker}
            >
                <Picker.Item label="Body Stats" value="body" />
                <Picker.Item label="Workouts" value="workout" />
            </Picker>
        </View>

        <View style={[styles.pickerWrapper, { flex: 0.55 }]}>
            {viewMode === "body" ? (
                <Picker
                    selectedValue={metricMode}
                    onValueChange={setMetricMode}
                    dropdownIconColor="#EAEAEA"
                    style={styles.picker}
                >
                    <Picker.Item label="Weight" value="weight" />
                    <Picker.Item label="Body Fat %" value="fat" />
                    <Picker.Item label="Muscle Mass" value="muscle" />
                    <Picker.Item label="All" value="all" />
                </Picker>
            ) : (
                <Picker
                    selectedValue={selectedExercise}
                    onValueChange={setSelectedExercise}
                    dropdownIconColor="#EAEAEA"
                    style={styles.picker}
                >
                    {availableExercises.map(ex => (
                        <Picker.Item key={ex} label={ex} value={ex} />
                    ))}
                </Picker>
            )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        
        {/* CHART SECTION */}
        {/* Only show chart if NOT in "All" workouts mode */}
        {(viewMode === "body" || (viewMode === "workout" && selectedExercise !== "All")) && (
            chartData.length > 1 ? (
            <View style={{ marginBottom: 24, marginTop: 8 }}>
                <MetricChart 
                    data={chartData} 
                    mode={viewMode === "workout" ? "weight" : metricMode} 
                    targetWeight={viewMode === "body" ? targetWeight : null} 
                />
                {viewMode === "workout" && (
                    <Text style={{color: '#666', textAlign: 'center', fontSize: 10, marginTop: -10}}>
                        Plotting heaviest set per day
                    </Text>
                )}
            </View>
            ) : (
            <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: "#555" }}>
                    {viewMode === "workout" && !selectedExercise 
                        ? "Log some workouts first" 
                        : "Not enough data to chart"}
                </Text>
            </View>
            )
        )}

        {/* --- LIST SECTION --- */}
        
        {/* 1. BODY STATS LIST */}
        {viewMode === "body" && (
            bodyData.slice().reverse().map((item: any) => ( 
            <HistoryCard
                key={item.date}
                date={item.date}
                weight={item.weight}
                bodyFat={item.bodyFat}
                muscleMass={item.muscleMass}
                photos={item.photos}
                onPressPhoto={(i) => openViewer(item.photos, i)}
                onLongPress={() => handleLongPress(item)}
            />
            ))
        )}

        {/* 2. WORKOUTS - "ALL" VIEW (Condensed Daily Summary) */}
        {viewMode === "workout" && selectedExercise === "All" && (
            groupedWorkouts.map((group) => (
                <View key={group.date} style={styles.workoutCard}>
                    {/* Header: Date */}
                    <View style={{ borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#EAEAEA', fontSize: 16, fontWeight: 'bold' }}>{group.date}</Text>
                        <Text style={{ color: '#888', fontSize: 12 }}>{group.logs.length} Exercises</Text>
                    </View>
                    
                    {/* List of Exercises for that day */}
                    {group.logs.map((log) => {
                        // Find best set for summary
                        const bestSet = log.sets.reduce((prev, current) => (prev.weight > current.weight) ? prev : current, { weight: 0, reps: 0 });
                        
                        return (
                            <View key={log.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Text style={{ color: '#CCC', fontSize: 14 }}>{log.exercise}</Text>
                                <Text style={{ color: '#4ADE80', fontSize: 14 }}>
                                    {bestSet.weight}kg × {bestSet.reps} <Text style={{color:'#666', fontSize:12}}>(Top Set)</Text>
                                </Text>
                            </View>
                        );
                    })}
                </View>
            ))
        )}

        {/* 3. WORKOUTS - SINGLE EXERCISE VIEW */}
        {viewMode === "workout" && selectedExercise !== "All" && (
            workoutData
                .filter(w => w.exercise === selectedExercise)
                .slice().reverse()
                .map((item) => (
                    <View key={item.id} style={styles.workoutCard}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
                             <Text style={{color: '#EAEAEA', fontSize: 16}}>{item.date}</Text>
                             <Ionicons name="fitness" size={16} color="#4ADE80" />
                        </View>
                        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                            {item.sets.map((set, i) => (
                                <View key={i} style={styles.setTag}>
                                    <Text style={{color: '#AAA', fontSize: 12}}>
                                        {set.weight}kg × {set.reps}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ))
        )}

      </ScrollView>

      {/* MODALS */}
      <LogModal 
        visible={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditLog(null); }}
        onSaved={load}
        existingLog={editLog}
      />

      <GoalModal 
        visible={isGoalOpen}
        onClose={() => setIsGoalOpen(false)}
        onSave={saveGoal}
        currentValue={targetWeight ? String(targetWeight) : ""}
      />

      <Modal
        visible={viewerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewerOpen(false)}
      >
        <View style={styles.modalBackground}>
          <Pressable onPress={() => setViewerOpen(false)} style={StyleSheet.absoluteFill} />
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
                    <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />
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
    fontWeight: "bold"
  },
  splitDropdownContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickerWrapper: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    height: 50,
    justifyContent: 'center',
    overflow: "hidden",
  },
  picker: {
    color: "#EAEAEA",
    backgroundColor: "transparent",
    marginLeft: -8, 
  },
  workoutCard: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4ADE80'
  },
  setTag: {
    backgroundColor: '#222',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333'
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