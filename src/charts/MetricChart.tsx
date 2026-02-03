import { View, Text } from "react-native";
import { LineChart, Grid, XAxis, YAxis } from "react-native-svg-charts";
import * as scale from "d3-scale";
import { useMemo, useState } from "react";
import { PinchGestureHandler, State } from "react-native-gesture-handler";

const colors = {
  weight: "#4ADE80",
  fat: "#60A5FA",
  muscle: "#FACC15",
};

function parseDate(v: any) {
  if (!v) return new Date();
  if (v instanceof Date) return v;

  if (typeof v === "string") {
    // Handle "YYYY-MM-DD" strings manually if needed, or trust Date constructor
    const p = v.split("-");
    if (p.length === 3) {
      const [y, m, d] = p.map(Number);
      return new Date(y, m - 1, d);
    }
  }
  return new Date(v);
}

export default function MetricChart({
  data,
  mode,
}: {
  data: any[];
  mode: "weight" | "fat" | "muscle" | "all";
}) {
  const [scaleFactor, setScaleFactor] = useState(1);

  const sliced = useMemo(() => {
    if (scaleFactor <= 1) return data;
    // Zoom logic: show fewer items as we scale up
    const keep = Math.max(3, Math.floor(data.length / scaleFactor));
    return data.slice(-keep);
  }, [data, scaleFactor]);

  // Determine which data points to map for the Y-Axis
  const yData =
    mode === "weight"
      ? sliced.map((d) => d.weight)
      : mode === "fat"
      ? sliced.map((d) => d.bodyFat)
      : mode === "muscle"
      ? sliced.map((d) => d.muscleMass)
      : sliced.flatMap((d) => [d.weight, d.bodyFat, d.muscleMass]);

  return (
    <View>
      <Text
        onPress={() => setScaleFactor(1)}
        style={{ color: "#888", marginBottom: 6, fontSize: 12, textAlign: 'right' }}
      >
        {scaleFactor > 1 ? "Reset Zoom" : " "}
      </Text>

      <View style={{ flexDirection: "row", height: 260 }}>
        {/* Y-Axis */}
        <YAxis
          data={yData}
          contentInset={{ top: 20, bottom: 20 }}
          svg={{ fill: "#777", fontSize: 10 }}
          numberOfTicks={6}
          formatLabel={(value) => `${value}`} 
        />

        <View style={{ flex: 1, marginLeft: 8 }}>
          <PinchGestureHandler
            onHandlerStateChange={(e) => {
              if (e.nativeEvent.state === State.END) {
                setScaleFactor((f) =>
                  Math.max(1, Math.min(6, f * e.nativeEvent.scale))
                );
              }
            }}
          >
            <View>
              {(mode === "weight" || mode === "all") && (
                <LineChart
                  style={{ height: 260 }}
                  data={sliced.map((d) => d.weight)}
                  svg={{ stroke: colors.weight, strokeWidth: 2 }}
                  contentInset={{ top: 20, bottom: 20 }}
                >
                  <Grid svg={{ stroke: "#222" }} />
                </LineChart>
              )}

              {(mode === "fat" || mode === "all") && (
                <LineChart
                  style={{ height: 260, position: "absolute", left: 0, right: 0 }}
                  data={sliced.map((d) => d.bodyFat)}
                  svg={{ stroke: colors.fat, strokeWidth: 2 }}
                  contentInset={{ top: 20, bottom: 20 }}
                />
              )}

              {(mode === "muscle" || mode === "all") && (
                <LineChart
                  style={{ height: 260, position: "absolute", left: 0, right: 0 }}
                  data={sliced.map((d) => d.muscleMass)}
                  svg={{ stroke: colors.muscle, strokeWidth: 2 }}
                  contentInset={{ top: 20, bottom: 20 }}
                />
              )}
            </View>
          </PinchGestureHandler>
        </View>
      </View>

      {/* X-Axis */}
      <XAxis
        style={{ marginHorizontal: 16, height: 24, marginTop: 8 }}
        data={sliced}
        scale={scale.scaleTime}
        xAccessor={({ item }) => parseDate(item.date)}
        numberOfTicks={5}
        formatLabel={(v) => `${v.getDate()}/${v.getMonth() + 1}`}
        svg={{ fill: "#777", fontSize: 10 }}
      />

      {/* Legend */}
      {mode === "all" && (
        <View style={{ flexDirection: "row", marginTop: 8, justifyContent: "center" }}>
          <Text style={{ color: colors.weight, marginRight: 12 }}>■ Weight</Text>
          <Text style={{ color: colors.fat, marginRight: 12 }}>■ Fat</Text>
          <Text style={{ color: colors.muscle }}>■ Muscle</Text>
        </View>
      )}
    </View>
  );
}