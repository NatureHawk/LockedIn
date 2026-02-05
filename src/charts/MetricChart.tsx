import { View, Text } from "react-native";
import { LineChart, Grid, XAxis, YAxis } from "react-native-svg-charts";
import { Line } from "react-native-svg";
import * as scale from "d3-scale";
import { useMemo, useState } from "react";
import { PinchGestureHandler, State } from "react-native-gesture-handler";

const colors = {
  weight: "#4ADE80",
  fat: "#60A5FA",
  muscle: "#FACC15",
  goal: "#AAA",
};

function parseDate(v: any) {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  if (typeof v === "string") {
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
  targetWeight,
}: {
  data: any[];
  mode: "weight" | "fat" | "muscle" | "all";
  targetWeight?: number | null;
}) {
  const [scaleFactor, setScaleFactor] = useState(1);

  const sliced = useMemo(() => {
    if (scaleFactor <= 1) return data;
    const keep = Math.max(3, Math.floor(data.length / scaleFactor));
    return data.slice(-keep);
  }, [data, scaleFactor]);

  const yData = useMemo(() => {
    let values =
      mode === "weight"
        ? sliced.map((d) => d.weight)
        : mode === "fat"
        ? sliced.map((d) => d.bodyFat)
        : mode === "muscle"
        ? sliced.map((d) => d.muscleMass)
        : sliced.flatMap((d) => [d.weight, d.bodyFat, d.muscleMass]);

    // Ensure goal line is visible by including it in the range
    if (mode === "weight" && targetWeight) {
      values = [...values, targetWeight];
    }
    return values;
  }, [sliced, mode, targetWeight]);

  const GoalLine = ({ y }: any) => {
    if (mode !== "weight" || !targetWeight) return null;
    return (
      <Line
        x1="0%"
        x2="100%"
        y1={y(targetWeight)}
        y2={y(targetWeight)}
        stroke={colors.goal}
        strokeDasharray={[6, 6]}
        strokeWidth={2}
        opacity={0.5}
      />
    );
  };

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text onPress={() => setScaleFactor(1)} style={{ color: "#888", fontSize: 12 }}>
          {scaleFactor > 1 ? "Reset Zoom" : " "}
        </Text>
        {targetWeight && mode === "weight" && (
           <Text style={{ color: colors.goal, fontSize: 12 }}>Goal: {targetWeight} kg</Text>
        )}
      </View>

      <View style={{ flexDirection: "row", height: 260 }}>
        <YAxis
          data={yData}
          contentInset={{ top: 20, bottom: 20 }}
          svg={{ fill: "#777", fontSize: 10 }}
          numberOfTicks={6}
          formatLabel={(v) => `${v}`}
        />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <PinchGestureHandler
            onHandlerStateChange={(e) => {
              if (e.nativeEvent.state === State.END) {
                setScaleFactor((f) => Math.max(1, Math.min(6, f * e.nativeEvent.scale)));
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
                  yMin={Math.min(...yData)}
                  yMax={Math.max(...yData)}
                >
                  <Grid svg={{ stroke: "#222" }} />
                  <GoalLine />
                </LineChart>
              )}
               {/* Fat / Muscle lines (same as before) */}
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
      <XAxis
        style={{ marginHorizontal: 16, height: 24, marginTop: 8 }}
        data={sliced}
        scale={scale.scaleTime}
        xAccessor={({ item }) => parseDate(item.date)}
        numberOfTicks={5}
        formatLabel={(v) => `${v.getDate()}/${v.getMonth() + 1}`}
        svg={{ fill: "#777", fontSize: 10 }}
      />
    </View>
  );
}