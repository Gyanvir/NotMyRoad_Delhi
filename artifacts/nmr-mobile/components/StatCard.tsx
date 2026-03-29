import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
}

export function StatCard({ label, value, icon, color = Colors.primary }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    alignItems: "flex-start",
    gap: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  value: {
    color: Colors.text,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
