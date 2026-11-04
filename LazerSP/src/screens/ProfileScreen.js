import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useVisits } from "../context/VisitsContext";
import theme from "../styles/theme";

function Benefit({ icon, text }) {
  return (
    <View style={styles.benefit}>
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, status, busy, available, signIn, signOut, deleteAccount } = useAuth();
  const { favorites } = useFavorites();
  const { visits } = useVisits();

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch {
      Alert.alert(t("auth.error_title"), t("auth.error_text"));
    }
  };

  const handleDelete = () => {
    Alert.alert(t("profile.delete_title"), t("profile.delete_text"), [
      { text: t("details.cancel"), style: "cancel" },
      {
        text: t("profile.delete_confirm"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAccount();
          } catch {
            Alert.alert(t("auth.error_title"), t("profile.delete_error"));
          }
        },
      },
    ]);
  };

  if (status === "loading") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (status !== "signedIn") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Ionicons name="person-circle-outline" size={72} color={theme.colors.border} style={styles.heroIcon} />
        <Text style={styles.title}>{t("profile.signed_out_title")}</Text>
        <Text style={styles.subtitle}>{t("profile.signed_out_text")}</Text>

        <View style={styles.card}>
          <Benefit icon="sync-outline" text={t("profile.benefit_sync")} />
          <Benefit icon="chatbubble-ellipses-outline" text={t("profile.benefit_reviews")} />
          <Benefit icon="phone-portrait-outline" text={t("profile.benefit_devices")} />
        </View>

        {available ? (
          <TouchableOpacity style={styles.googleButton} onPress={handleSignIn} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color={theme.colors.white} />
                <Text style={styles.googleButtonText}>{t("auth.sign_in_google")}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <Text style={styles.unavailable}>{t("auth.unavailable")}</Text>
        )}

        <Text style={styles.footnote}>{t("profile.optional_note")}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.userRow}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle" size={64} color={theme.colors.primary} />
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.syncRow}>
          <Ionicons name="cloud-done-outline" size={20} color={theme.colors.success} />
          <Text style={styles.syncText}>{t("profile.synced")}</Text>
        </View>
        <Text style={styles.stat}>{t("profile.favorites_count", { count: favorites.length })}</Text>
        <Text style={styles.stat}>{t("profile.visits_count", { count: Object.keys(visits).length })}</Text>
      </View>

      <TouchableOpacity style={styles.outlineButton} onPress={signOut} disabled={busy}>
        <Ionicons name="log-out-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.outlineButtonText}>{t("profile.sign_out")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dangerButton} onPress={handleDelete} disabled={busy}>
        <Text style={styles.dangerButtonText}>{t("profile.delete_account")}</Text>
      </TouchableOpacity>
      <Text style={styles.footnote}>{t("profile.delete_note")}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroIcon: { alignSelf: "center", marginTop: theme.spacing.md },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, textAlign: "center", marginTop: 8 },
  subtitle: { fontSize: 15, color: theme.colors.textLight, textAlign: "center", lineHeight: 22, marginTop: 6, marginBottom: theme.spacing.md },
  card: { backgroundColor: theme.colors.white, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, gap: 12, marginBottom: theme.spacing.md },
  benefit: { flexDirection: "row", alignItems: "center", gap: 12 },
  benefitText: { flex: 1, fontSize: 14, color: theme.colors.text, lineHeight: 20 },
  googleButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 15 },
  googleButtonText: { color: theme.colors.white, fontWeight: "700", fontSize: 15 },
  unavailable: { fontSize: 14, color: theme.colors.textLight, textAlign: "center", lineHeight: 21 },
  footnote: { fontSize: 12, color: theme.colors.textLight, textAlign: "center", lineHeight: 18, marginTop: 12 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: theme.spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: "800", color: theme.colors.text },
  userEmail: { fontSize: 14, color: theme.colors.textLight, marginTop: 2 },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  syncText: { fontSize: 14, fontWeight: "700", color: theme.colors.success },
  stat: { fontSize: 14, color: theme.colors.text },
  outlineButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 2, borderColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 13, marginBottom: 12 },
  outlineButtonText: { color: theme.colors.primary, fontWeight: "700", fontSize: 15 },
  dangerButton: { alignItems: "center", paddingVertical: 12 },
  dangerButtonText: { color: theme.colors.danger, fontWeight: "700", fontSize: 14 },
});
