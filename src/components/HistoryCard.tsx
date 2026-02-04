import { View, Text, Image, Pressable } from "react-native";

type Props = {
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
  photos?: string[];
  onPressPhoto?: (index: number) => void;
  onLongPress?: () => void; // <--- NEW PROP
};

export default function HistoryCard({
  date,
  weight,
  bodyFat,
  muscleMass,
  photos = [],
  onPressPhoto,
  onLongPress, // <--- Destructure it
}: Props) {
  return (
    <Pressable
      onLongPress={onLongPress} // <--- Hook it up
      delayLongPress={500} // Hold for 0.5s to trigger
      style={({ pressed }) => ({
        backgroundColor: pressed ? "#222" : "#1A1A1A", // Visual feedback
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: "#EAEAEA", fontSize: 16, marginBottom: 6 }}>
          {date}
        </Text>
        {/* Optional: Add a tiny icon or text to hint at editability */}
      </View>

      <Text style={{ color: "#AAA" }}>Weight: {weight} kg</Text>
      <Text style={{ color: "#AAA" }}>Body Fat: {bodyFat} %</Text>
      <Text style={{ color: "#AAA" }}>Muscle: {muscleMass} kg</Text>

      {photos.length > 0 && (
        <View style={{ flexDirection: "row", marginTop: 10 }}>
          {photos.map((uri, i) => (
            <Pressable
              key={i}
              onPress={() => onPressPhoto?.(i)}
              style={{ marginRight: 8 }}
            >
              <Image
                source={{ uri }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                }}
              />
            </Pressable>
          ))}
        </View>
      )}
    </Pressable>
  );
}