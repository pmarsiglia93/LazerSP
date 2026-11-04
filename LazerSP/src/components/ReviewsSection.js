import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";
import { deleteReview, fetchReviews, saveReview } from "../services/userService";
import theme from "../styles/theme";

const MAX_COMMENT = 500;
const PAGE_SIZE = 10;

function Stars({ value, size = 14, onChange }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = (
          <Ionicons
            name={star <= value ? "star" : "star-outline"}
            size={size}
            color={star <= value ? theme.colors.secondary : theme.colors.border}
          />
        );
        return onChange ? (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={`${star}`}
          >
            {icon}
          </TouchableOpacity>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}

function formatDate(iso, language) {
  const date = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(language);
}

/** Avaliações da comunidade: média, lista e formulário da própria avaliação. */
export default function ReviewsSection({ placeId }) {
  const { t, i18n } = useTranslation();
  const { status, available, signIn, busy: authBusy } = useAuth();
  const signedIn = status === "signedIn";

  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ total: 0, average: null });
  const [mine, setMine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (offset = 0) => {
      setError(false);
      if (offset === 0) setLoading(true);
      try {
        const res = await fetchReviews(placeId, { limit: PAGE_SIZE, offset });
        setReviews((prev) => (offset === 0 ? res.data : [...prev, ...res.data]));
        setMeta(res.meta);
        setMine(res.mine);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [placeId]
  );

  // Recarrega ao entrar ou sair da conta, para mostrar ou esconder a própria avaliação
  useEffect(() => {
    load(0);
  }, [load, signedIn]);

  const startEditing = () => {
    setRating(mine?.rating ?? 0);
    setComment(mine?.comment ?? "");
    setEditing(true);
  };

  const handleRatePress = async () => {
    if (signedIn) return startEditing();
    try {
      const ok = await signIn();
      if (ok) startEditing();
    } catch {
      Alert.alert(t("auth.error_title"), t("auth.error_text"));
    }
  };

  const handleSave = async () => {
    if (rating < 1) return;
    setSaving(true);
    try {
      await saveReview(placeId, { rating, comment: comment.trim() });
      setEditing(false);
      await load(0);
    } catch (e) {
      const message = e.response?.status === 429 ? t("reviews.too_many") : t("reviews.save_error");
      Alert.alert(t("reviews.title"), message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t("reviews.delete_title"), t("reviews.delete_text"), [
      { text: t("details.cancel"), style: "cancel" },
      {
        text: t("reviews.delete_confirm"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteReview(placeId);
            await load(0);
          } catch {
            Alert.alert(t("reviews.title"), t("reviews.save_error"));
          }
        },
      },
    ]);
  };

  const otherReviews = mine ? reviews.filter((r) => r.id !== mine.id) : reviews;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("reviews.title")}</Text>
        {meta.total > 0 && (
          <View style={styles.summary}>
            <Ionicons name="star" size={16} color={theme.colors.secondary} />
            <Text style={styles.summaryText}>
              {meta.average?.toFixed(1)} · {t(meta.total === 1 ? "reviews.count_one" : "reviews.count_other", { count: meta.total })}
            </Text>
          </View>
        )}
      </View>

      {editing ? (
        <View style={styles.form}>
          <Text style={styles.formLabel}>{t("reviews.your_rating")}</Text>
          <Stars value={rating} size={30} onChange={setRating} />
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder={t("reviews.comment_placeholder")}
            placeholderTextColor={theme.colors.textLight}
            multiline
            maxLength={MAX_COMMENT}
          />
          <Text style={styles.counter}>{comment.length}/{MAX_COMMENT}</Text>
          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.primaryButton, (rating < 1 || saving) && styles.disabled]}
              onPress={handleSave}
              disabled={rating < 1 || saving}
            >
              {saving ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.primaryButtonText}>{t("reviews.publish")}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(false)}>
              <Text style={styles.linkText}>{t("details.cancel")}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>{t("reviews.public_hint")}</Text>
        </View>
      ) : mine ? (
        <View style={[styles.review, styles.mine]}>
          <View style={styles.reviewHeader}>
            <Text style={styles.author}>{t("reviews.your_review")}</Text>
            <Stars value={mine.rating} />
          </View>
          {!!mine.comment && <Text style={styles.comment}>{mine.comment}</Text>}
          {mine.status === "hidden" && <Text style={styles.hiddenNote}>{t("reviews.hidden_note")}</Text>}
          <View style={styles.mineActions}>
            <TouchableOpacity onPress={startEditing}>
              <Text style={styles.linkText}>{t("reviews.edit")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Text style={[styles.linkText, { color: theme.colors.danger }]}>{t("reviews.delete")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : signedIn || available ? (
        <TouchableOpacity style={styles.rateButton} onPress={handleRatePress} disabled={authBusy}>
          <Ionicons name={signedIn ? "create-outline" : "logo-google"} size={18} color={theme.colors.primary} />
          <Text style={styles.rateButtonText}>{signedIn ? t("reviews.write") : t("reviews.sign_in_to_rate")}</Text>
        </TouchableOpacity>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loading} color={theme.colors.primary} />
      ) : error ? (
        <TouchableOpacity onPress={() => load(0)}>
          <Text style={styles.empty}>{t("reviews.load_error")}</Text>
        </TouchableOpacity>
      ) : otherReviews.length === 0 && !mine ? (
        <Text style={styles.empty}>{t("reviews.empty")}</Text>
      ) : (
        otherReviews.map((review) => (
          <View key={review.id} style={styles.review}>
            <View style={styles.reviewHeader}>
              <Text style={styles.author}>{review.author.name}</Text>
              <Stars value={review.rating} />
            </View>
            {!!review.comment && <Text style={styles.comment}>{review.comment}</Text>}
            <Text style={styles.date}>{formatDate(review.updatedAt || review.createdAt, i18n.language)}</Text>
          </View>
        ))
      )}

      {!loading && reviews.length < meta.total && (
        <TouchableOpacity onPress={() => load(reviews.length)} style={styles.moreButton}>
          <Text style={styles.linkText}>{t("reviews.load_more")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 17, fontWeight: "700", color: theme.colors.text },
  summary: { flexDirection: "row", alignItems: "center", gap: 4 },
  summaryText: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
  stars: { flexDirection: "row", gap: 2 },
  rateButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 12, marginBottom: 12 },
  rateButtonText: { color: theme.colors.primary, fontWeight: "700", fontSize: 14 },
  form: { backgroundColor: theme.colors.white, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, marginBottom: 12, gap: 10 },
  formLabel: { fontSize: 13, fontWeight: "700", color: theme.colors.text },
  input: { minHeight: 80, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: 10, fontSize: 14, color: theme.colors.text, textAlignVertical: "top" },
  counter: { alignSelf: "flex-end", fontSize: 12, color: theme.colors.textLight },
  formActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  primaryButton: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, paddingVertical: 10, paddingHorizontal: 18, minWidth: 110, alignItems: "center" },
  primaryButtonText: { color: theme.colors.white, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  hint: { fontSize: 12, color: theme.colors.textLight, lineHeight: 18 },
  review: { backgroundColor: theme.colors.white, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 8, gap: 6 },
  mine: { borderColor: theme.colors.primary + "55" },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  author: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
  comment: { fontSize: 14, color: theme.colors.text, lineHeight: 21 },
  date: { fontSize: 12, color: theme.colors.textLight },
  hiddenNote: { fontSize: 12, color: theme.colors.danger, fontWeight: "600" },
  mineActions: { flexDirection: "row", gap: 16 },
  linkText: { color: theme.colors.primary, fontWeight: "700", fontSize: 14 },
  empty: { fontSize: 14, color: theme.colors.textLight, paddingVertical: 8 },
  loading: { paddingVertical: 12 },
  moreButton: { alignItems: "center", paddingVertical: 10 },
});
