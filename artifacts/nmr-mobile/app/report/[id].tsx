import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDistanceToNow, format } from "date-fns";
import { useGetReport } from "@workspace/api-client-react";
import { Colors } from "@/constants/colors";
import { StatusBadge } from "@/components/StatusBadge";

const ISSUE_LABELS: Record<string, string> = {
  pothole: "Pothole",
  broken_road: "Broken Road",
  waterlogging: "Waterlogging",
  missing_manhole: "Missing Manhole",
  damaged_divider: "Damaged Divider",
  other: "Other",
};

const ROAD_LABELS: Record<string, string> = {
  main_road: "Main Road",
  highway: "Highway",
  lane: "Lane",
  colony_road: "Colony Road",
};

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: report, isLoading, isError } = useGetReport(
    { id: Number(id) },
    { query: { retry: false } }
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 20;

  const handleShare = async () => {
    if (!report) return;
    const tweetText = `🚨 Road issue in ${report.area}, Delhi! ${ISSUE_LABELS[report.issueType] ?? report.issueType} on ${ROAD_LABELS[report.roadType] ?? report.roadType}. Authority: @${report.authority}. This needs urgent attention! #Delhi #NotMyRoad`;

    try {
      if (Platform.OS === "web") {
        await navigator.clipboard?.writeText(tweetText);
        Alert.alert("Copied!", "Tweet draft copied to clipboard");
      } else {
        await Share.share({ message: tweetText });
      }
    } catch {
      Alert.alert("Error", "Could not share");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !report) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: topPad }]}>
        <Feather name="alert-circle" size={40} color={Colors.textMuted} />
        <Text style={styles.errorText}>Report not found</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const timeline = Array.isArray(report.timeline) ? report.timeline : [];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomPad }}
    >
      {/* Back button overlay */}
      <TouchableOpacity style={[styles.backBtn, { top: topPad + 12 }]} onPress={() => router.back()}>
        <Feather name="arrow-left" size={20} color={Colors.text} />
      </TouchableOpacity>

      {/* Hero Image */}
      {report.imageUrl ? (
        <Image source={{ uri: report.imageUrl }} style={styles.heroImage} />
      ) : (
        <View style={[styles.heroImage, styles.noImage]}>
          <Feather name="alert-triangle" size={40} color={Colors.textMuted} />
        </View>
      )}

      <View style={styles.body}>
        {/* Status + ID */}
        <View style={styles.topRow}>
          <StatusBadge status={report.status} />
          <Text style={styles.reportId}>#{String(report.id).padStart(4, "0")}</Text>
        </View>

        {/* Title */}
        <Text style={styles.issueTitle}>
          {ISSUE_LABELS[report.issueType] ?? report.issueType}
        </Text>

        {/* Meta grid */}
        <View style={styles.metaGrid}>
          {[
            { icon: "map-pin" as const, label: "Area", value: report.area },
            { icon: "layers" as const, label: "Road", value: ROAD_LABELS[report.roadType] ?? report.roadType },
            { icon: "shield" as const, label: "Authority", value: report.authority },
            { icon: "clock" as const, label: "Days Open", value: `${report.daysUnresolved} days` },
          ].map((m) => (
            <View key={m.label} style={styles.metaCard}>
              <Feather name={m.icon} size={16} color={Colors.primary} />
              <Text style={styles.metaLabel}>{m.label}</Text>
              <Text style={styles.metaValue}>{m.value}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        {report.description ? (
          <View style={styles.descCard}>
            <Text style={styles.descTitle}>Description</Text>
            <Text style={styles.descText}>{report.description}</Text>
          </View>
        ) : null}

        {/* Reporter */}
        <View style={styles.reporterCard}>
          <View style={styles.reporterAvatar}>
            <Text style={styles.reporterAvatarText}>
              {(report.userName ?? "A")[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.reporterName}>{report.userName ?? "Anonymous"}</Text>
            <Text style={styles.reporterTime}>
              Reported {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        {timeline.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.timeline}>
              {timeline.map((event: any, i: number) => (
                <View key={i} style={styles.timelineItem}>
                  <View style={styles.timelineDotWrap}>
                    <View style={[styles.timelineDot, i === 0 && styles.timelineDotActive]} />
                    {i < timeline.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStatus}>{event.status?.replace(/_/g, " ")}</Text>
                    {event.note && <Text style={styles.timelineNote}>{event.note}</Text>}
                    <Text style={styles.timelineDate}>
                      {event.timestamp ? format(new Date(event.timestamp), "dd MMM yyyy, hh:mm a") : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tweet / Share */}
        <TouchableOpacity style={styles.tweetBtn} onPress={handleShare}>
          <Feather name="twitter" size={18} color={Colors.info} />
          <Text style={styles.tweetBtnText}>Share as Tweet Draft</Text>
          <Feather name="share-2" size={16} color={Colors.info} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { alignItems: "center", justifyContent: "center", gap: 16, flex: 1 },
  backBtn: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: { width: "100%", height: 240, backgroundColor: Colors.border },
  noImage: { alignItems: "center", justifyContent: "center" },
  body: { padding: 20, gap: 20 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reportId: { color: Colors.textMuted, fontSize: 13, fontFamily: "Inter_500Medium" },
  issueTitle: {
    color: Colors.text,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textTransform: "capitalize",
    letterSpacing: -0.5,
  },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metaCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    gap: 4,
  },
  metaLabel: { color: Colors.textMuted, fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { color: Colors.text, fontSize: 15, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  descCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
  },
  descTitle: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  descText: { color: Colors.text, fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  reporterCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
  },
  reporterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  reporterAvatarText: { color: Colors.primary, fontSize: 16, fontFamily: "Inter_700Bold" },
  reporterName: { color: Colors.text, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reporterTime: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: {},
  sectionTitle: { color: Colors.text, fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 16 },
  timeline: {},
  timelineItem: { flexDirection: "row", gap: 14, marginBottom: 4 },
  timelineDotWrap: { alignItems: "center", width: 16 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    marginTop: 4,
  },
  timelineDotActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.cardBorder, marginTop: 4, marginBottom: -4 },
  timelineContent: { flex: 1, paddingBottom: 20 },
  timelineStatus: { color: Colors.text, fontSize: 14, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  timelineNote: { color: Colors.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  timelineDate: { color: Colors.textMuted, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  tweetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(59,130,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
    borderRadius: 14,
    paddingVertical: 14,
  },
  tweetBtnText: { color: Colors.info, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  errorText: { color: Colors.text, fontSize: 18, fontFamily: "Inter_600SemiBold" },
  backLink: { marginTop: 8 },
  backLinkText: { color: Colors.primary, fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
