import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetStats, useListReports } from "@workspace/api-client-react";
import { Colors } from "@/constants/colors";
import { StatCard } from "@/components/StatCard";
import { ReportCard } from "@/components/ReportCard";
import { useAuth } from "@/contexts/AuthContext";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetStats({
    query: { retry: false },
  });

  const { data: reports, isLoading: reportsLoading, refetch: refetchReports } = useListReports(
    { limit: 5 },
    { query: { retry: false } }
  );

  const isRefreshing = statsLoading || reportsLoading;

  const onRefresh = () => {
    refetchStats();
    refetchReports();
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>NotMyRoad</Text>
          <Text style={styles.subtitle}>Delhi Road Issue Tracker</Text>
        </View>
        {user ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name[0].toUpperCase()}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/(tabs)/profile" as any)}
          >
            <Text style={styles.loginBtnText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard
          label="Total Reports"
          value={stats?.totalReports ?? "—"}
          icon="alert-triangle"
          color={Colors.primary}
        />
        <StatCard
          label="Resolved"
          value={stats?.resolvedReports ?? "—"}
          icon="check-circle"
          color={Colors.statusResolved}
        />
        <StatCard
          label="Pending"
          value={stats?.pendingReports ?? "—"}
          icon="clock"
          color={Colors.statusPending}
        />
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.cta}
        onPress={() => router.push("/(tabs)/report" as any)}
        activeOpacity={0.85}
      >
        <Feather name="plus-circle" size={22} color="#000" />
        <Text style={styles.ctaText}>Report a Road Issue</Text>
        <Feather name="chevron-right" size={20} color="#000" />
      </TouchableOpacity>

      {/* Recent Reports */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/feed" as any)}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {reportsLoading ? (
          [1, 2, 3].map((i) => <View key={i} style={styles.skeleton} />)
        ) : !reports?.length ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No reports yet</Text>
          </View>
        ) : (
          reports.slice(0, 4).map((r) => <ReportCard key={r.id} report={r} />)
        )}
      </View>

      <View style={{ height: Platform.OS === "web" ? 34 : 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  brand: {
    color: Colors.primary,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryDim,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  loginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  loginBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 28,
  },
  ctaText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "center",
  },
  section: { marginBottom: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  skeleton: {
    height: 160,
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
