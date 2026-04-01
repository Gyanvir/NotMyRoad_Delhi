import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
  Alert,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCreateReport } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import * as ImagePicker from 'expo-image-picker';


const ISSUE_TYPES = [
  { key: "pothole", label: "Pothole" },
  { key: "broken_road", label: "Broken Road" },
  { key: "waterlogging", label: "Waterlogging" },
  { key: "missing_manhole", label: "Missing Manhole" },
  { key: "damaged_divider", label: "Damaged Divider" },
  { key: "other", label: "Other" },
];

const ROAD_TYPES = [
  { key: "main_road", label: "Main Road" },
  { key: "highway", label: "Highway" },
  { key: "lane", label: "Lane" },
  { key: "colony_road", label: "Colony Road" },
];

const AUTHORITIES = [
  { key: "MCD", label: "MCD", desc: "Municipal Corporation of Delhi" },
  { key: "PWD", label: "PWD", desc: "Public Works Department" },
  { key: "NHAI", label: "NHAI", desc: "National Highways Auth. of India" },
  { key: "DDA", label: "DDA", desc: "Delhi Development Authority" },
];

const STEPS = ["Details", "Location", "Authority", "Review"];

export default function ReportScreen() {
  const createMutation = useCreateReport();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [issueType, setIssueType] = useState("");
  const [roadType, setRoadType] = useState("");
  const [area, setArea] = useState("");
  const [authority, setAuthority] = useState("");
  const [description, setDescription] = useState("");
  // const [image, setImage] = useState
  const [image, setImage] = useState<any>(null);
  // const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const pickImage = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert('Permission required', 'Allow gallery access');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });

  if (!result.canceled) {
    setImage(result.assets[0]);
  }
};
  if (!user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: topPad }]}>
        <Feather name="lock" size={48} color={Colors.textMuted} />
        <Text style={styles.authTitle}>Sign in to report</Text>
        <Text style={styles.authSub}>You need an account to submit road issue reports</Text>
        <TouchableOpacity
          style={styles.authBtn}
          onPress={() => router.push("/(tabs)/profile" as any)}
        >
          <Text style={styles.authBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!area.trim()) {
      Alert.alert("Missing info", "Please enter the area/location");
      return;
    }
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await createMutation.mutateAsync({
        data: {
          userId: user.id,
          userName: user.name,
          issueType: issueType as any,
          roadType: roadType as any,
          authority: authority as any,
          description,
          area,
          imageUrl: image ? image.uri : undefined,
          // imageUrl: imageUrl || "https://thepatriot.in/reports/roads-in-disrepair-citizens-in-despair-20288",
          latitude: 28.6139,
          longitude: 77.209,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/report/${res.id}` as any);
    } catch (e) {
      Alert.alert("Error", "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canNext =
    (step === 0 && issueType && roadType) ||
    (step === 1 && area.trim().length > 0) ||
    (step === 2 && authority);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Report Issue</Text>
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                {i < step ? (
                  <Feather name="check" size={12} color="#000" />
                ) : (
                  <Text style={[styles.stepNum, i === step && styles.stepNumActive]}>{i + 1}</Text>
                )}
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < step && styles.stepLineActive]} />
              )}
            </View>
          ))}
        </View>
        <Text style={styles.stepLabel}>{STEPS[step]}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        {/* Step 0: Issue Details */}
        {step === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What type of issue?</Text>
            <View style={styles.optionGrid}>
              {ISSUE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.optionChip, issueType === t.key && styles.optionChipActive]}
                  onPress={() => setIssueType(t.key)}
                >
                  <Text style={[styles.optionText, issueType === t.key && styles.optionTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Road type</Text>
            <View style={styles.optionGrid}>
              {ROAD_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.optionChip, roadType === t.key && styles.optionChipActive]}
                  onPress={() => setRoadType(t.key)}
                >
                  <Text style={[styles.optionText, roadType === t.key && styles.optionTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Description (optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where is the issue?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Connaught Place, Lajpat Nagar..."
              placeholderTextColor={Colors.textMuted}
              value={area}
              onChangeText={setArea}
              autoFocus
            />
            <Text style={styles.hint}>Enter the area, landmark, or address</Text>

            <View style={styles.locationCard}>
              <Feather name="map-pin" size={20} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>GPS Location</Text>
                <Text style={styles.locationSub}>28.6139° N, 77.2090° E (Delhi center)</Text>
              </View>
              <View style={styles.locationBadge}>
                <Text style={styles.locationBadgeText}>Auto</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Add a photo</Text>
            <Pressable
              onPress={pickImage}
              style={{
                backgroundColor: '#00FF7F',
                padding: 14,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#000', fontWeight: 'bold' }}>
                {image ? "Change Photo" : "Upload Photo"}
              </Text>
            </Pressable>
            {image && (
              <Image
                source={{ uri: image.uri }}
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              />
            )}
          </View>

        )}{/* Step 2: Authority */}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Responsible authority</Text>
            <Text style={styles.hint}>Who should fix this issue?</Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              {AUTHORITIES.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.authorityCard, authority === a.key && styles.authorityCardActive]}
                  onPress={() => setAuthority(a.key)}
                >
                  <View style={[styles.authorityIcon, authority === a.key && styles.authorityIconActive]}>
                    <Text style={[styles.authorityKey, authority === a.key && styles.authorityKeyActive]}>
                      {a.key}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.authorityLabel, authority === a.key && { color: Colors.primary }]}>
                      {a.label}
                    </Text>
                    <Text style={styles.authorityDesc}>{a.desc}</Text>
                  </View>
                  {authority === a.key && (
                    <Feather name="check-circle" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review your report</Text>
            {[
              { label: "Issue", value: ISSUE_TYPES.find((t) => t.key === issueType)?.label },
              { label: "Road", value: ROAD_TYPES.find((t) => t.key === roadType)?.label },
              { label: "Area", value: area },
              { label: "Authority", value: authority },
              { label: "Description", value: description || "—" },
            ].map((row) => (
              <View key={row.label} style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{row.label}</Text>
                <Text style={styles.reviewValue}>{row.value}</Text>
              </View>
            ))}

            {image ? (
              <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
            ) : null}

            <View style={styles.tweetBox}>
              <Feather name="twitter" size={16} color={Colors.info} />
              <Text style={styles.tweetText} numberOfLines={3}>
                {`🚨 Road issue in ${area}, Delhi! ${ISSUE_TYPES.find((t) => t.key === issueType)?.label} on ${ROAD_TYPES.find((t) => t.key === roadType)?.label}. Authority: @${authority}. #Delhi #NotMyRoad`}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 }]}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Feather name="arrow-left" size={18} color={Colors.text} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {step < 3 ? (
          <TouchableOpacity
            style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canNext}
          >
            <Text style={styles.nextBtnText}>Next</Text>
            <Feather name="arrow-right" size={18} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.nextBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Text style={styles.nextBtnText}>Submit Report</Text>
                <Feather name="send" size={18} color="#000" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 },
  authTitle: { color: Colors.text, fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  authSub: { color: Colors.textMuted, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  authBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  authBtnText: { color: "#000", fontSize: 15, fontFamily: "Inter_700Bold" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  title: {
    color: Colors.text,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNum: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  stepNumActive: { color: "#000" },
  stepLine: { flex: 1, height: 1.5, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: Colors.primary },
  stepLabel: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_500Medium" },
  body: { flex: 1 },
  bodyContent: { padding: 20 },
  section: {},
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  optionChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  optionText: { color: Colors.textMuted, fontSize: 13, fontFamily: "Inter_500Medium" },
  optionTextActive: { color: Colors.primary },
  textArea: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    minHeight: 100,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    marginBottom: 8,
  },
  hint: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 12 },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    padding: 14,
    marginTop: 4,
  },
  locationTitle: { color: Colors.text, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  locationSub: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  locationBadge: {
    backgroundColor: Colors.primaryDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  locationBadgeText: { color: Colors.primary, fontSize: 11, fontFamily: "Inter_600SemiBold" },
  imagePreview: { width: "100%", height: 160, borderRadius: 12, marginTop: 8, backgroundColor: Colors.border },
  authorityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  authorityCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  authorityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  authorityIconActive: { backgroundColor: Colors.primary },
  authorityKey: { color: Colors.textMuted, fontSize: 11, fontFamily: "Inter_700Bold" },
  authorityKeyActive: { color: "#000" },
  authorityLabel: { color: Colors.text, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  authorityDesc: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  reviewLabel: { color: Colors.textMuted, fontSize: 14, fontFamily: "Inter_500Medium" },
  reviewValue: { color: Colors.text, fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1, marginLeft: 16 },
  tweetBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(59,130,246,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
    padding: 14,
    marginTop: 16,
    alignItems: "flex-start",
  },
  tweetText: { color: Colors.info, fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: { color: Colors.text, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: "#000", fontSize: 15, fontFamily: "Inter_700Bold" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
});
