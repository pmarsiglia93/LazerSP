import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFavorites } from "../context/FavoritesContext";
import { useLocation } from "../context/LocationContext";
import { fetchPlaceById } from "../services/placesService";
import theme from "../styles/theme";

export default function DetailsScreen({ route, navigation }) {
  // Recebe o lugar completo (para exibição imediata) ou só o ID
  const { placeId, place: initialPlace } = route.params;

  const [place, setPlace] = useState(initialPlace || null);
  const [loading, setLoading] = useState(!initialPlace);
  const [error, setError] = useState(null);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { getDistance } = useLocation();

  // Busca dados atualizados da API
  useEffect(() => {
    fetchPlaceById(placeId)
      .then((res) => setPlace(res.data))
      .catch(() => {
        if (!initialPlace) setError("Não foi possível carregar os detalhes.");
      })
      .finally(() => setLoading(false));
  }, [placeId]);

  // Atualiza o título do header com o nome do lugar
  useEffect(() => {
    if (place?.name) {
      navigation.setOptions({ title: place.name });
    }
  }, [place?.name, navigation]);

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
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const favorite = isFavorite(place.id);
  const distance = getDistance(place.latitude, place.longitude);
  const distanceLabel = distance !== null ? `${distance.toFixed(1)} km de você` : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image
        source={{ uri: place.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{place.name}</Text>
            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{place.category}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: place.isOpen ? "#E6F9F0" : "#FFF0F0" },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: place.isOpen ? theme.colors.success : theme.colors.danger },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: place.isOpen ? theme.colors.success : theme.colors.danger },
                  ]}
                >
                  {place.isOpen ? "Aberto agora" : "Fechado"}
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

        {/* Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Avaliação</Text>
            <Text style={styles.infoValue}>⭐ {place.rating}</Text>
          </View>
          <View style={styles.infoSeparator} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Horário</Text>
            <Text style={styles.infoValue}>{place.openingHours}</Text>
          </View>
          <View style={styles.infoSeparator} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Preço</Text>
            <Text style={styles.infoValue}>{place.priceLevel}</Text>
          </View>
        </View>

        {/* Botão Favorito */}
        <TouchableOpacity
          style={[styles.favoriteButton, favorite && styles.favoriteButtonActive]}
          onPress={() => toggleFavorite(place)}
        >
          <Ionicons
            name={favorite ? "heart" : "heart-outline"}
            size={20}
            color={favorite ? theme.colors.white : theme.colors.primary}
          />
          <Text
            style={[
              styles.favoriteButtonText,
              favorite && styles.favoriteButtonTextActive,
            ]}
          >
            {favorite ? "Salvo nos favoritos" : "Adicionar aos favoritos"}
          </Text>
        </TouchableOpacity>

        {/* Botões de transporte */}
        <View style={styles.transportRow}>
          <TouchableOpacity
            style={[styles.transportButton, styles.directionsButton]}
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=transit`
              )
            }
          >
            <Ionicons name="navigate" size={18} color={theme.colors.white} />
            <Text style={styles.directionsButtonText}>Como chegar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.transportButton, styles.uberButton]}
            onPress={() => {
              const name = encodeURIComponent(place.name);
              const uberApp = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${place.latitude}&dropoff[longitude]=${place.longitude}&dropoff[nickname]=${name}`;
              const uberWeb = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${place.latitude}&dropoff[longitude]=${place.longitude}&dropoff[nickname]=${name}`;
              Linking.canOpenURL(uberApp).then((installed) =>
                Linking.openURL(installed ? uberApp : uberWeb)
              );
            }}
          >
            <Ionicons name="car" size={18} color={theme.colors.white} />
            <Text style={styles.uberButtonText}>Ir de Uber</Text>
          </TouchableOpacity>
        </View>

        {/* Botão Instagram */}
        {place.instagram && (
          <TouchableOpacity
            style={styles.instagramButton}
            onPress={() => {
              const appUrl = `instagram://user?username=${place.instagram}`;
              const webUrl = `https://www.instagram.com/${place.instagram}`;
              Linking.canOpenURL(appUrl).then((installed) =>
                Linking.openURL(installed ? appUrl : webUrl)
              );
            }}
          >
            <Ionicons name="logo-instagram" size={18} color={theme.colors.white} />
            <Text style={styles.instagramButtonText}>Ver no Instagram</Text>
          </TouchableOpacity>
        )}

        {/* Destaque */}
        <View style={styles.highlightBox}>
          <Ionicons name="star" size={16} color={theme.colors.secondary} />
          <Text style={styles.highlightText}>{place.highlight}</Text>
        </View>

        <Text style={styles.sectionTitle}>Endereço</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.addressText}>{place.address}</Text>
        </View>

        <Text style={styles.sectionTitle}>Sobre o local</Text>
        <Text style={styles.description}>{place.description}</Text>

        {place.tags && place.tags.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tags</Text>
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: theme.spacing.lg,
  },
  image: {
    width: "100%",
    height: 280,
  },
  content: {
    padding: theme.spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  name: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary + "18",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  categoryText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  distanceText: {
    color: theme.colors.success,
    fontWeight: "700",
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: "700",
    textAlign: "center",
  },
  infoSeparator: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    marginBottom: 16,
  },
  favoriteButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  favoriteButtonText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  favoriteButtonTextActive: {
    color: theme.colors.white,
  },
  transportRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  transportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
  },
  directionsButton: {
    backgroundColor: theme.colors.success,
  },
  directionsButtonText: {
    color: theme.colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  uberButton: {
    backgroundColor: "#000000",
  },
  uberButtonText: {
    color: theme.colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  instagramButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C13584",
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    marginBottom: 16,
  },
  instagramButtonText: {
    color: theme.colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
  highlightBox: {
    backgroundColor: theme.colors.secondary + "22",
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontStyle: "italic",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textLight,
    lineHeight: 22,
  },
  description: {
    fontSize: 15,
    lineHeight: 26,
    color: theme.colors.textLight,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tagText: {
    color: theme.colors.textLight,
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 15,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: "700",
  },
});
