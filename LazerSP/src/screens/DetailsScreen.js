import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

import { useFavorites } from "../context/FavoritesContext";
import { useLocation } from "../context/LocationContext";
import { useVisits } from "../context/VisitsContext";
import { fetchPlaceById } from "../services/placesService";
import theme from "../styles/theme";

const DATE_LOCALES = { pt: "pt-BR", en: "en-US", es: "es-ES" };
const RATING_KEYS = ["", "details.rating_1", "details.rating_2", "details.rating_3", "details.rating_4", "details.rating_5"];

export default function DetailsScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { placeId, place: initialPlace } = route.params;

  const [place, setPlace] = useState(initialPlace || null);
  const [loading, setLoading] = useState(!initialPlace);
  const [error, setError] = useState(null);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { getDistance } = useLocation();
  const { isVisited, getVisit, saveVisit, toggleVisited } = useVisits();

  const visited = isVisited(placeId);
  const visit = getVisit(placeId);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    fetchPlaceById(placeId)
      .then((res) => setPlace(res.data))
      .catch(() => {
        if (!initialPlace) setError(t("details.load_error"));
      })
      .finally(() => setLoading(false));
  }, [placeId]);

  useEffect(() => {
    if (place?.name) navigation.setOptions({ title: place.name });
  }, [place?.name, navigation]);

  useEffect(() => {
    setNoteText(visit?.note || "");
    setEditingNote(false);
  }, [visited]);

  if (loading && !place) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error && !place) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>{t("details.back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const favorite = isFavorite(place.id);
  const distance = getDistance(place.latitude, place.longitude);
  const distanceLabel = distance !== null ? `${distance.toFixed(1)} km ${t("details.from_you")}` : null;
  const dateLocale = DATE_LOCALES[i18n.language] || "pt-BR";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: place.imageUrl }} style={styles.image} contentFit="cover" transition={300} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{place.name}</Text>
            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{place.category}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: place.isOpen ? "#E6F9F0" : "#FFF0F0" }]}>
                <View style={[styles.statusDot, { backgroundColor: place.isOpen ? theme.colors.success : theme.colors.danger }]} />
                <Text style={[styles.statusText, { color: place.isOpen ? theme.colors.success : theme.colors.danger }]}>
                  {place.isOpen ? t("details.open") : t("details.closed")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {distanceLabel && (
          <View style={styles.distanceRow}>
            <Ionicons name="navigate-outline" size={16} color={theme.colors.success} />
            <Text style={styles.distanceText}>{distanceLabel}</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t("details.rating")}</Text>
            <Text style={styles.infoValue}>⭐ {place.rating}</Text>
          </View>
          <View style={styles.infoSeparator} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t("details.hours")}</Text>
            <Text style={styles.infoValue}>{place.openingHours}</Text>
          </View>
          <View style={styles.infoSeparator} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t("details.price")}</Text>
            <Text style={styles.infoValue}>{place.priceLevel}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.favoriteButton, favorite && styles.favoriteButtonActive]}
          onPress={() => toggleFavorite(place)}
        >
          <Ionicons name={favorite ? "heart" : "heart-outline"} size={20} color={favorite ? theme.colors.white : theme.colors.primary} />
          <Text style={[styles.favoriteButtonText, favorite && styles.favoriteButtonTextActive]}>
            {favorite ? t("details.saved_favorite") : t("details.save_favorite")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.visitedButton, visited && styles.visitedButtonActive]}
          onPress={() => toggleVisited(placeId)}
        >
          <Ionicons name={visited ? "checkmark-circle" : "checkmark-circle-outline"} size={20} color={visited ? theme.colors.white : theme.colors.success} />
          <Text style={[styles.visitedButtonText, visited && styles.visitedButtonTextActive]}>
            {visited ? t("details.visited") : t("details.mark_visited")}
          </Text>
        </TouchableOpacity>

        {visited && (
          <View style={styles.experienceBox}>
            <Text style={styles.experienceTitle}>{t("details.your_experience")}</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => saveVisit(placeId, { rating: star, note: visit?.note || "" })}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons
                    name={star <= (visit?.rating || 0) ? "star" : "star-outline"}
                    size={32}
                    color={star <= (visit?.rating || 0) ? theme.colors.secondary : theme.colors.border}
                  />
                </TouchableOpacity>
              ))}
              {visit?.rating && (
                <Text style={styles.ratingLabel}>{t(RATING_KEYS[visit.rating])}</Text>
              )}
            </View>

            {editingNote ? (
              <View style={styles.noteInputWrapper}>
                <TextInput
                  style={styles.noteInput}
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder={t("details.note_placeholder")}
                  placeholderTextColor={theme.colors.textLight}
                  multiline
                  autoFocus
                  maxLength={280}
                />
                <View style={styles.noteActions}>
                  <TouchableOpacity
                    style={styles.noteSaveButton}
                    onPress={() => {
                      saveVisit(placeId, { rating: visit?.rating || null, note: noteText });
                      setEditingNote(false);
                    }}
                  >
                    <Text style={styles.noteSaveText}>{t("details.save")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setNoteText(visit?.note || ""); setEditingNote(false); }}>
                    <Text style={styles.noteCancelText}>{t("details.cancel")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.notePreview} onPress={() => { setNoteText(visit?.note || ""); setEditingNote(true); }}>
                <Ionicons name="create-outline" size={16} color={theme.colors.textLight} />
                <Text style={[styles.notePreviewText, visit?.note && styles.notePreviewFilled]}>
                  {visit?.note || t("details.note_prompt")}
                </Text>
              </TouchableOpacity>
            )}

            {visit?.visitedAt && (
              <Text style={styles.visitedDate}>
                {t("details.visited_at", {
                  date: new Date(visit.visitedAt).toLocaleDateString(dateLocale, {
                    day: "2-digit", month: "long", year: "numeric",
                  }),
                })}
              </Text>
            )}
          </View>
        )}

        <View style={styles.transportRow}>
          <TouchableOpacity
            style={[styles.transportButton, styles.directionsButton]}
            onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=transit`)}
          >
            <Ionicons name="navigate" size={18} color={theme.colors.white} />
            <Text style={styles.directionsButtonText}>{t("details.directions")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.transportButton, styles.uberButton]}
            onPress={() => {
              const name = encodeURIComponent(place.name);
              const uberApp = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${place.latitude}&dropoff[longitude]=${place.longitude}&dropoff[nickname]=${name}`;
              const uberWeb = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${place.latitude}&dropoff[longitude]=${place.longitude}&dropoff[nickname]=${name}`;
              Linking.canOpenURL(uberApp).then((installed) => Linking.openURL(installed ? uberApp : uberWeb));
            }}
          >
            <Ionicons name="car" size={18} color={theme.colors.white} />
            <Text style={styles.uberButtonText}>{t("details.uber")}</Text>
          </TouchableOpacity>
        </View>

        {place.instagram && (
          <TouchableOpacity
            style={styles.instagramButton}
            onPress={() => {
              const appUrl = `instagram://user?username=${place.instagram}`;
              const webUrl = `https://www.instagram.com/${place.instagram}`;
              Linking.canOpenURL(appUrl).then((installed) => Linking.openURL(installed ? appUrl : webUrl));
            }}
          >
            <Ionicons name="logo-instagram" size={18} color={theme.colors.white} />
            <Text style={styles.instagramButtonText}>{t("details.instagram")}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.highlightBox}>
          <Ionicons name="star" size={16} color={theme.colors.secondary} />
          <Text style={styles.highlightText}>{place.highlight}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t("details.address")}</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.addressText}>{place.address}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t("details.about")}</Text>
        <Text style={styles.description}>{place.description}</Text>

        {place.tags && place.tags.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t("details.tags")}</Text>
            <View style={styles.tagsContainer}>
              {place.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: theme.spacing.xl }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: theme.spacing.lg },
  image: { width: "100%", height: 280 },
  content: { padding: theme.spacing.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  name: { fontSize: 26, fontWeight: "800", color: theme.colors.text, marginBottom: 10 },
  categoryRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  categoryBadge: { backgroundColor: theme.colors.primary + "18", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  categoryText: { color: theme.colors.primary, fontWeight: "700", fontSize: 13 },
  statusBadge: { flexDirection: "row", alignItems: "center", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 999 },
  statusText: { fontSize: 13, fontWeight: "700" },
  distanceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  distanceText: { color: theme.colors.success, fontWeight: "700", fontSize: 14 },
  infoBox: { backgroundColor: theme.colors.white, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border, flexDirection: "row", justifyContent: "space-around" },
  infoItem: { alignItems: "center", flex: 1 },
  infoLabel: { fontSize: 12, color: theme.colors.textLight, marginBottom: 4, fontWeight: "600" },
  infoValue: { fontSize: 13, color: theme.colors.text, fontWeight: "700", textAlign: "center" },
  infoSeparator: { width: 1, backgroundColor: theme.colors.border, marginVertical: 4 },
  favoriteButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 2, borderColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.radius.md, marginBottom: 16 },
  favoriteButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  favoriteButtonText: { color: theme.colors.primary, fontWeight: "700", fontSize: 15 },
  favoriteButtonTextActive: { color: theme.colors.white },
  transportRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  transportButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: theme.radius.md },
  directionsButton: { backgroundColor: theme.colors.success },
  directionsButtonText: { color: theme.colors.white, fontWeight: "700", fontSize: 14 },
  uberButton: { backgroundColor: "#000000" },
  uberButtonText: { color: theme.colors.white, fontWeight: "700", fontSize: 14 },
  instagramButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#C13584", paddingVertical: 14, borderRadius: theme.radius.md, marginBottom: 16 },
  instagramButtonText: { color: theme.colors.white, fontWeight: "700", fontSize: 15 },
  highlightBox: { backgroundColor: theme.colors.secondary + "22", borderLeftWidth: 4, borderLeftColor: theme.colors.secondary, borderRadius: theme.radius.sm, padding: theme.spacing.md, marginBottom: 16, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  highlightText: { flex: 1, fontSize: 14, color: theme.colors.text, fontStyle: "italic", lineHeight: 22 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.text, marginTop: 16, marginBottom: 8 },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 8 },
  addressText: { flex: 1, fontSize: 14, color: theme.colors.textLight, lineHeight: 22 },
  description: { fontSize: 15, lineHeight: 26, color: theme.colors.textLight },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  tag: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  tagText: { color: theme.colors.textLight, fontSize: 13, fontWeight: "600" },
  errorText: { color: theme.colors.danger, fontSize: 15, textAlign: "center" },
  retryButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radius.md },
  retryButtonText: { color: theme.colors.white, fontWeight: "700" },
  visitedButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 2, borderColor: theme.colors.success, paddingVertical: 14, borderRadius: theme.radius.md, marginBottom: 16 },
  visitedButtonActive: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  visitedButtonText: { color: theme.colors.success, fontWeight: "700", fontSize: 15 },
  visitedButtonTextActive: { color: theme.colors.white },
  experienceBox: { backgroundColor: theme.colors.white, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, marginBottom: 16, gap: 12 },
  experienceTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingLabel: { marginLeft: 6, fontSize: 14, fontWeight: "700", color: theme.colors.secondary },
  notePreview: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme.colors.background, borderRadius: theme.radius.sm, padding: theme.spacing.sm },
  notePreviewText: { flex: 1, fontSize: 14, color: theme.colors.textLight, fontStyle: "italic" },
  notePreviewFilled: { color: theme.colors.text, fontStyle: "normal" },
  noteInputWrapper: { gap: 8 },
  noteInput: { backgroundColor: theme.colors.background, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.primary, padding: theme.spacing.sm, fontSize: 14, color: theme.colors.text, minHeight: 80, textAlignVertical: "top" },
  noteActions: { flexDirection: "row", alignItems: "center", gap: 16, justifyContent: "flex-end" },
  noteSaveButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: theme.radius.sm },
  noteSaveText: { color: theme.colors.white, fontWeight: "700", fontSize: 14 },
  noteCancelText: { color: theme.colors.textLight, fontSize: 14, fontWeight: "600" },
  visitedDate: { fontSize: 12, color: theme.colors.textLight, textAlign: "right" },
});
