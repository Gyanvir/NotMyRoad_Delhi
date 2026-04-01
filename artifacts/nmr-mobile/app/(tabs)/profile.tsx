import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { useListReports } from "@workspace/api-client-react";

type Mode = "login" | "register";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, login, register, logout, isLoading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const params = { userId: user?.id?.toString(), status: filter === "all" ? undefined : (filter as any) };

  const { data: reports, isLoading, refetch, isRefetching } = useListReports(
    params,
    {
      query: {
        queryKey: ['reports', params], // <-- required!
        enabled: !!user,
      },
    }
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      console.log("Registration error:", e);
      const msg = e?.data?.error ?? (mode === "login" ? "Invalid credentials" : "Registration failed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
        },
      },
    ]);
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (user) {
    const totalReports = reports?.length ?? 0;
    const resolved = reports?.filter((r: {status: string}) => r.status === "resolved").length ?? 0;
    const initials = user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.profileContent, { paddingTop: topPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalReports}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxDivider]}>
            <Text style={[styles.statNum, { color: Colors.statusResolved }]}>{resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: Colors.statusPending }]}>
              {totalReports - resolved}
            </Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="mail" size={16} color={Colors.textMuted} />
            <Text style={styles.infoText}>{user.email}</Text>
          </View>
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: Colors.cardBorder, marginTop: 12, paddingTop: 12 }]}>
            <Feather name="calendar" size={16} color={Colors.textMuted} />
            <Text style={styles.infoText}>
              Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </Text>
          </View>
        </View>

        {/* Demo tweet */}
        <View style={styles.badgeCard}>
          <Feather name="award" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.badgeTitle}>Civic Champion</Text>
            <Text style={styles.badgeSub}>Thanks for making Delhi's roads safer</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={Colors.destructive} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: Platform.OS === "web" ? 34 : 100 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.authContent, { paddingTop: topPad + 24 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View style={styles.logoWrap}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>NR</Text>
        </View>
        <Text style={styles.logoTitle}>NotMyRoad</Text>
        <Text style={styles.logoSub}>Report. Track. Resolve.</Text>
      </View>

      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}
          onPress={() => { setMode("login"); setError(""); }}
        >
          <Text style={[styles.modeBtnText, mode === "login" && styles.modeBtnTextActive]}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "register" && styles.modeBtnActive]}
          onPress={() => { setMode("register"); setError(""); }}
        >
          <Text style={[styles.modeBtnText, mode === "register" && styles.modeBtnTextActive]}>Register</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={Colors.destructive} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {mode === "register" && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitBtnText}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.demoHint}>Demo: demo@notmyroad.in / Demo@1234</Text>
      </View>

      <View style={{ height: Platform.OS === "web" ? 34 : 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { alignItems: "center", justifyContent: "center" },
  profileContent: { paddingHorizontal: 24 },
  avatarWrap: { alignItems: "center", marginBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryDim,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: Colors.primary, fontSize: 28, fontFamily: "Inter_700Bold" },
  userName: { color: Colors.text, fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  userEmail: { color: Colors.textMuted, fontSize: 14, fontFamily: "Inter_400Regular" },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
    overflow: "hidden",
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 20 },
  statBoxDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statNum: { color: Colors.text, fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  statLabel: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_400Regular" },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoText: { color: Colors.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular" },
  badgeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.primaryDim,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    padding: 16,
    marginBottom: 24,
  },
  badgeTitle: { color: Colors.primary, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  badgeSub: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.destructive + "50",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(255,68,68,0.05)",
  },
  logoutText: { color: Colors.destructive, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  authContent: { paddingHorizontal: 28 },
  logoWrap: { alignItems: "center", marginBottom: 36 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primaryDim,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoText: { color: Colors.primary, fontSize: 26, fontFamily: "Inter_700Bold" },
  logoTitle: { color: Colors.text, fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  logoSub: { color: Colors.textMuted, fontSize: 14, fontFamily: "Inter_400Regular" },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    marginBottom: 24,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeBtnText: { color: Colors.textMuted, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modeBtnTextActive: { color: "#000" },
  form: { gap: 12 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,68,68,0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.destructive + "40",
    padding: 12,
  },
  errorText: { color: Colors.destructive, fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    color: Colors.text,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: { color: "#000", fontSize: 16, fontFamily: "Inter_700Bold" },
  demoHint: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
  },
});
