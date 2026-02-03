import { View, Text, Image, Pressable } from "react-native";

type Props = {
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
  photos?: string[];
  onPressPhoto?: (index: number) => void;
};

export default function HistoryCard({
  date,
  weight,
  bodyFat,
  muscleMass,
  photos = [],
  onPressPhoto,
}: Props) {
  return (
    <View
      style={{
        backgroundColor: "#1A1A1A",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <Text style={{ color: "#EAEAEA", fontSize: 16, marginBottom: 6 }}>
        {date}
      </Text>

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
    </View>
  );
}
