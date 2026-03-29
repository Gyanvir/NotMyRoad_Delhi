import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useListReports } from "@workspace/api-client-react";
import { Colors } from "@/constants/colors";
import { ReportCard } from "@/components/ReportCard";
import { Feather } from "@expo/vector-icons";

type Filter = "all" | "pending" | "in_progress" | "resolved";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("all");

  const { data: reports, isLoading, refetch, isRefetching } = useListReports(
    { status: filter === "all" ? undefined : (filter as any) },
    { query: { retry: false } }
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.title}>Community Feed</Text>
        <Text style={styles.subtitle}>Road issues reported across Delhi</Text>

        {/* Filter Chips */}
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, filter === f.key && styles.chipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={reports ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ReportCard report={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No reports found</Text>
              <Text style={styles.emptyText}>
                {filter === "all" ? "Be the first to report an issue" : `No ${filter.replace("_", " ")} reports`}
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: Platform.OS === "web" ? 34 : 100 }} />}
          scrollEnabled={!!(reports && reports.length > 0)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  title: {
    color: Colors.text,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  chipTextActive: {
    color: Colors.primary,
  },
  list: { padding: 20, paddingTop: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
