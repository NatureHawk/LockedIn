import { Modal, View, Text, TextInput, Pressable, Keyboard } from "react-native";
import { useState, useEffect } from "react";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (val: string) => void;
  currentValue?: string;
};

export default function GoalModal({ visible, onClose, onSave, currentValue }: Props) {
  const [val, setVal] = useState("");

  useEffect(() => {
    if (visible) setVal(currentValue || "");
  }, [visible, currentValue]);

  const handleSave = () => {
    onSave(val);
    setVal("");
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 }}>
        <View style={{ backgroundColor: "#1A1A1A", borderRadius: 12, padding: 20 }}>
          <Text style={{ color: "#EAEAEA", fontSize: 18, marginBottom: 16, fontWeight: "600" }}>
            Set Target Weight (kg)
          </Text>
          
          <TextInput
            autoFocus
            keyboardType="decimal-pad"
            value={val}
            onChangeText={setVal}
            placeholder="e.g. 75.0"
            placeholderTextColor="#666"
            style={{
              backgroundColor: "#0F0F0F",
              color: "#FFF",
              padding: 12,
              borderRadius: 8,
              fontSize: 18,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#333"
            }}
          />

          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
            <Pressable onPress={onClose} style={{ padding: 10 }}>
              <Text style={{ color: "#AAA", fontSize: 16 }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={{ backgroundColor: "#4ADE80", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
              <Text style={{ color: "#0F0F0F", fontWeight: "bold", fontSize: 16 }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}