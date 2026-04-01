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
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useListReports } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { ReportCard } from "@/components/ReportCard";
import { StatCard } from "@/components/StatCard";

type Filter = "all" | "pending" | "in_progress" | "resolved";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");

  const params = {
    userId: user?.id?.toString(),
    status: filter === "all" ? undefined : (filter as any),
  };

  const { data: reports, isLoading, refetch, isRefetching } = useListReports(
    params,
    { query: { queryKey: ['reports', params], enabled: !!user, retry: false } }
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: topPad }]}>
        <View style={styles.lockIcon}>
          <Feather name="bar-chart-2" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.authTitle}>Track your reports</Text>
        <Text style={styles.authSub}>Sign in to see all the road issues you've reported</Text>
        <TouchableOpacity
          style={styles.authBtn}
          onPress={() => router.push("/(tabs)/profile" as any)}
        >
          <Text style={styles.authBtnText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile" as any)}>
          <Text style={styles.registerLink}>Create account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allReports = reports ?? [];
  const resolved = allReports.filter((r: {status: string}) => r.status === "resolved").length;
  const pending = allReports.filter((r: {status: string}) => r.status === "pending").length;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>My Reports</Text>
            <Text style={styles.subtitle}>Hey {user.name.split(" ")[0]}, here's your impact</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/(tabs)/report" as any)}
          >
            <Feather name="plus" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Mini stats */}
        {!isLoading && (
          <View style={styles.statsRow}>
            <StatCard label="Total" value={allReports.length} icon="file-text" />
            <StatCard label="Resolved" value={resolved} icon="check-circle" color={Colors.statusResolved} />
            <StatCard label="Pending" value={pending} icon="clock" color={Colors.statusPending} />
          </View>
        )}

        {/* Filters */}
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, filter === f.key && styles.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
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
              <Text style={styles.emptyTitle}>
                {filter === "all" ? "No reports yet" : `No ${filter.replace("_", " ")} reports`}
              </Text>
              {filter === "all" && (
                <TouchableOpacity
                  style={styles.reportCta}
                  onPress={() => router.push("/(tabs)/report" as any)}
                >
                  <Text style={styles.reportCtaText}>Report your first issue</Text>
                </TouchableOpacity>
              )}
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
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primaryDim,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    alignItems: "center",
    justifyContent: "center",
  },
  authTitle: { color: Colors.text, fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  authSub: { color: Colors.textMuted, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  authBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  authBtnText: { color: "#000", fontSize: 15, fontFamily: "Inter_700Bold" },
  registerLink: { color: Colors.primary, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: { color: Colors.text, fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { color: Colors.textMuted, fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filters: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  chipText: { color: Colors.textMuted, fontSize: 13, fontFamily: "Inter_500Medium" },
  chipTextActive: { color: Colors.primary },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 20, paddingTop: 16 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  reportCta: {
    marginTop: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  reportCtaText: { color: "#000", fontSize: 14, fontFamily: "Inter_700Bold" },
});
