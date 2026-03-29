import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

type Status = "pending" | "in_progress" | "resolved";

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: Colors.statusPending, bg: "rgba(245,158,11,0.15)" },
  in_progress: { label: "In Progress", color: Colors.statusInProgress, bg: "rgba(59,130,246,0.15)" },
  resolved: { label: "Resolved", color: Colors.statusResolved, bg: "rgba(0,255,127,0.15)" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as Status] ?? { label: status, color: Colors.textMuted, bg: Colors.cardBorder };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
