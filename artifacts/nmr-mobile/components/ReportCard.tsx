import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { Colors } from "@/constants/colors";
import { StatusBadge } from "@/components/StatusBadge";

interface Report {
  id: number;
  issueType: string;
  area: string;
  authority: string;
  status: string;
  imageUrl?: string;
  daysUnresolved: number;
  createdAt: string;
  userName?: string;
}

export function ReportCard({ report }: { report: Report }) {
  const router = useRouter();
  const issueLabel = report.issueType.replace(/_/g, " ");

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/report/${report.id}` as any)}
      activeOpacity={0.75}
    >
      {report.imageUrl ? (
        <Image source={{ uri: report.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Feather name="alert-triangle" size={24} color={Colors.textMuted} />
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.issueType} numberOfLines={1}>{issueLabel}</Text>
          <StatusBadge status={report.status} />
        </View>
        <View style={styles.row}>
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text style={styles.meta} numberOfLines={1}>{report.area}</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.row}>
            <Feather name="shield" size={12} color={Colors.textMuted} />
            <Text style={styles.meta}>{report.authority}</Text>
          </View>
          <Text style={styles.time}>
            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: 140,
    backgroundColor: Colors.border,
  },
  noImage: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 14,
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  issueType: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
    flex: 1,
    marginRight: 8,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  meta: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  time: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
