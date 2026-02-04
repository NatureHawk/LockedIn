import { View, Text, Dimensions } from "react-native";

const BOX_SIZE = 12;
const GAP = 4;
const DAYS_TO_SHOW = 105; // ~15 weeks

function getPastDates(days: number) {
  const dates = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split("T")[0]); // "YYYY-MM-DD"
  }
  return dates;
}

export default function ConsistencyGrid({ logs }: { logs: any[] }) {
  const dates = getPastDates(DAYS_TO_SHOW);
  const logSet = new Set(logs.map((l) => l.date));

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: 320, // Constrain width to keep it tidy
        gap: GAP,
      }}
    >
      {dates.map((date) => {
        const isLogged = logSet.has(date);
        return (
          <View
            key={date}
            style={{
              width: BOX_SIZE,
              height: BOX_SIZE,
              borderRadius: 2,
              backgroundColor: isLogged ? "#4ADE80" : "#1A1A1A",
              opacity: isLogged ? 1 : 0.5,
            }}
          />
        );
      })}
    </View>
  );
}