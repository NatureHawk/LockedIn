import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
  Keyboard,
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  init,
  addWorkout,
  getWorkouts,
  deleteWorkout,
  updateWorkout,
  getUniqueExercises, // <--- New Import
  WorkoutLog,
  WorkoutSet,
} from "../../src/db/database";

const DEFAULT_EXERCISES = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press",
  "Pull Up", "Dumbbell Row", "Bicep Curl", "Tricep Extension",
  "Leg Press", "Lat Pulldown", "Lateral Raise", "Face Pull",
  "Incline Dumbbell Press", "Hammer Curl", "Cable Fly"
];

function fmtDate(d = new Date()) {
  return d.toISOString().split("T")[0];
}

export default function Workouts() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Custom Exercise State
  const [exerciseList, setExerciseList] = useState<string[]>(DEFAULT_EXERCISES);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");

  // Form State
  const [selectedExercise, setSelectedExercise] = useState(DEFAULT_EXERCISES[0]);
  const [sets, setSets] = useState<WorkoutSet[]>([{ weight: 0, reps: 0 }]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    const today = fmtDate();
    
    // 1. Load today's logs
    const data = await getWorkouts(today);
    setLogs(data);

    // 2. Load historical exercises (Self-Learning)
    const historyList = await getUniqueExercises();
    
    // Merge defaults with history, remove duplicates, and sort
    const combined = Array.from(new Set([...DEFAULT_EXERCISES, ...historyList])).sort();
    setExerciseList(combined);
  };

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  // --- ACTIONS ---

  const handleOpenNew = () => {
    setEditingId(null);
    // 🛡️ Force a fallback if exerciseList[0] is missing
    const defaultEx = exerciseList.length > 0 ? exerciseList[0] : "Bench Press";
    setSelectedExercise(defaultEx);
    setSets([{ weight: 0, reps: 0 }]);
    setModalVisible(true);
  };

  const handleOpenEdit = (log: WorkoutLog) => {
    setEditingId(log.id);
    setSelectedExercise(log.exercise);
    setSets(log.sets);
    setModalVisible(true);
  };

  const handleAddSet = () => {
    setSets([...sets, { weight: 0, reps: 0 }]);
  };

  const updateSet = (index: number, field: "weight" | "reps", value: string) => {
    const newSets = [...sets];
    const numVal = value === "" ? 0 : parseFloat(value);
    newSets[index] = { ...newSets[index], [field]: numVal };
    setSets(newSets);
  };

  const removeSet = (index: number) => {
    if (sets.length === 1) return;
    const newSets = sets.filter((_, i) => i !== index);
    setSets(newSets);
  };

  const saveWorkout = async () => {
    const validSets = sets.filter((s) => s.weight > 0 || s.reps > 0);

    if (validSets.length === 0) {
      Alert.alert("Invalid Data", "Enter at least one set with weight or reps.");
      return;
    }

    if (editingId) {
      await updateWorkout(editingId, validSets);
    } else {
      await addWorkout(fmtDate(), selectedExercise, validSets);
    }

    setModalVisible(false);
    setSets([{ weight: 0, reps: 0 }]);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Delete", "Remove this exercise?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteWorkout(id);
          load();
        },
      },
    ]);
  };

  const saveCustomExercise = () => {
    if (!newExerciseName.trim()) return;
    
    const name = newExerciseName.trim();
    // Add to local list immediately so we can select it
    setExerciseList(prev => Array.from(new Set([...prev, name])).sort());
    setSelectedExercise(name); // Auto-select it
    
    setCustomModalOpen(false);
    setNewExerciseName("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Today's Lift 🏋️‍♂️</Text>

      <ScrollView style={{ flex: 1 }}>
        {logs.length === 0 ? (
          <View style={{ marginTop: 50, alignItems: "center" }}>
            <Text style={{ color: "#555" }}>No exercises logged today.</Text>
            <Text style={{ color: "#444", fontSize: 12, marginTop: 4 }}>
              Get to work!
            </Text>
          </View>
        ) : (
          logs.map((log) => (
            <Pressable
              key={log.id}
              onPress={() => handleOpenEdit(log)}
              onLongPress={() => handleDelete(log.id)}
              style={styles.card}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                 <Text style={styles.cardTitle}>{log.exercise}</Text>
                 <Ionicons name="pencil" size={14} color="#444" />
              </View>
              
              <View style={styles.setRow}>
                {log.sets.map((s, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {s.weight}kg x {s.reps}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable onPress={handleOpenNew} style={styles.fab}>
        <Ionicons name="add" size={32} color="#0F0F0F" />
      </Pressable>

      {/* MAIN LOGGING MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <Pressable 
            style={styles.modalContainer} 
            onPress={() => Keyboard.dismiss()} 
        >
          <Pressable style={styles.modalContent} onPress={() => {}}> 
            <Text style={styles.modalHeader}>
              {editingId ? "Edit Exercise" : "Log Exercise"}
            </Text>

            {/* Exercise Picker Row */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <View style={[styles.pickerContainer, { flex: 1 }]}>
                    <Picker
                        selectedValue={selectedExercise}
                        enabled={!editingId}
                        onValueChange={(itemValue) => setSelectedExercise(itemValue)}
                        style={{ color: editingId ? "#555" : "#EAEAEA", backgroundColor: "#222" }}
                        dropdownIconColor="#EAEAEA"
                    >
                        {exerciseList.map((ex) => (
                        <Picker.Item key={ex} label={ex} value={ex} />
                        ))}
                    </Picker>
                </View>
                
                {/* NEW: Add Custom Exercise Button */}
                {!editingId && (
                    <Pressable 
                        onPress={() => setCustomModalOpen(true)}
                        style={{ 
                            width: 50, backgroundColor: '#333', borderRadius: 8, 
                            justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#444' 
                        }}
                    >
                        <Ionicons name="add" size={24} color="#4ADE80" />
                    </Pressable>
                )}
            </View>

            {/* Sets Inputs */}
            <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
              {sets.map((set, i) => (
                <View key={i} style={styles.inputRow}>
                  <Text style={{ color: "#888", width: 20, paddingTop: 12 }}>{i + 1}</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      placeholder="kg"
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                      value={String(set.weight || "")}
                      style={styles.input}
                      onChangeText={(v) => updateSet(i, "weight", v)}
                    />
                  </View>
                  <Text style={{ color: "#666", marginTop: 10 }}>x</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      placeholder="reps"
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                      value={String(set.reps || "")}
                      style={styles.input}
                      onChangeText={(v) => updateSet(i, "reps", v)}
                    />
                  </View>
                  {sets.length > 0 && (
                    <Pressable onPress={() => removeSet(i)} style={{ padding: 10 }}>
                      <Ionicons name="trash-outline" size={20} color="#F87171" />
                    </Pressable>
                  )}
                </View>
              ))}
            </ScrollView>

            <Pressable onPress={handleAddSet} style={styles.addSetBtn}>
              <Text style={{ color: "#4ADE80" }}>+ Add Set</Text>
            </Pressable>

            <View style={styles.actionRow}>
              <Pressable onPress={() => setModalVisible(false)} style={{ padding: 10 }}>
                <Text style={{ color: "#888" }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveWorkout} style={styles.saveBtn}>
                <Text style={{ color: "#0F0F0F", fontWeight: "bold" }}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* CUSTOM EXERCISE NAME MODAL */}
      <Modal visible={customModalOpen} transparent animationType="fade" onRequestClose={() => setCustomModalOpen(false)}>
        <View style={styles.centerModal}>
            <View style={styles.smallModalContent}>
                <Text style={{ color: '#EAEAEA', fontSize: 18, marginBottom: 12, fontWeight: 'bold' }}>New Exercise</Text>
                <TextInput 
                    autoFocus
                    value={newExerciseName}
                    onChangeText={setNewExerciseName}
                    placeholder="e.g. Bulgarian Split Squat"
                    placeholderTextColor="#666"
                    style={{ 
                        backgroundColor: '#0F0F0F', color: '#FFF', padding: 12, 
                        borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#333' 
                    }}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                    <Pressable onPress={() => setCustomModalOpen(false)} style={{ padding: 8 }}>
                        <Text style={{ color: '#888' }}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={saveCustomExercise} style={{ backgroundColor: '#4ADE80', padding: 8, borderRadius: 6 }}>
                        <Text style={{ color: '#0F0F0F', fontWeight: 'bold' }}>Add</Text>
                    </Pressable>
                </View>
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F", padding: 20 },
  header: { fontSize: 24, fontWeight: "bold", color: "#EAEAEA", marginBottom: 20 },
  card: { backgroundColor: "#1A1A1A", padding: 16, borderRadius: 12, marginBottom: 12 },
  cardTitle: { color: "#FFF", fontSize: 18, marginBottom: 8, fontWeight: "600" },
  setRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: "#333", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tagText: { color: "#AAA", fontSize: 12 },
  fab: {
    position: "absolute", bottom: 30, right: 20, backgroundColor: "#4ADE80",
    width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", elevation: 5
  },
  modalContainer: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.8)", padding: 20 },
  modalContent: { backgroundColor: "#1A1A1A", borderRadius: 16, padding: 20 },
  modalHeader: { color: "#FFF", fontSize: 20, marginBottom: 16, fontWeight: "bold" },
  pickerContainer: { backgroundColor: "#222", borderRadius: 8, overflow: "hidden" },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  inputWrap: { flex: 1, backgroundColor: "#222", borderRadius: 8 },
  input: { color: "#FFF", padding: 10, textAlign: "center" },
  addSetBtn: { alignSelf: "center", marginVertical: 10, padding: 10 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  saveBtn: { backgroundColor: "#4ADE80", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  
  // Custom Modal Styles
  centerModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 30 },
  smallModalContent: { backgroundColor: "#1A1A1A", padding: 20, borderRadius: 12 },
});