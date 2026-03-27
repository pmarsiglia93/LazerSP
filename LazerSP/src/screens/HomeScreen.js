import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Animated, { FadeInDown } from "react-native-reanimated";
import { useState } from "react";
import CategoryFilter from "../components/CategoryFilter";
import PlaceCard from "../components/PlaceCard";
import SearchBar from "../components/SearchBar";
import SkeletonCard from "../components/SkeletonCard";
import { useFavorites } from "../context/FavoritesContext";
import { useLocation } from "../context/LocationContext";
import { useVisits } from "../context/VisitsContext";
import { usePlaces } from "../hooks/usePlaces";
import theme from "../styles/theme";

export default function HomeScreen({ navigation }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isVisited } = useVisits();
  const {
    loading: locationLoading,
    error: locationError,
    openSettings,
    setManualLocation,
  } = useLocation();

  const [addressInput, setAddressInput] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState(null);
  // Resultado encontrado aguardando confirmação: { label, lat, lon }
  const [foundAddress, setFoundAddress] = useState(null);

  const searchAddress = async () => {
    if (!addressInput.trim()) return;
    setAddressLoading(true);
    setAddressError(null);
    setFoundAddress(null);
    try {
      const query = encodeURIComponent(`${addressInput.trim()}, São Paulo, Brasil`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        {
          headers: {
            "Accept-Language": "pt-BR",
            "User-Agent": "LazerSP/1.0 (TCC - Guia de Lazer SP)",
          },
        }
      );
      if (!res.ok) {
        setAddressError("Erro ao buscar endereço. Tente novamente.");
        return;
      }
      const data = await res.json();
      if (data.length === 0) {
        setAddressError("Endereço não encontrado. Tente ser mais específico.");
        return;
      }
      // Mostra o endereço para confirmação antes de aplicar
      setFoundAddress({
        label: data[0].display_name,
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      });
    } catch {
      setAddressError("Erro ao buscar endereço. Verifique sua conexão.");
    } finally {
      setAddressLoading(false);
    }
  };

  const confirmAddress = () => {
    if (!foundAddress) return;
    setManualLocation({ latitude: foundAddress.lat, longitude: foundAddress.lon });
    setFoundAddress(null);
  };

  const rejectAddress = () => {
    setFoundAddress(null);
    setAddressError("Endereço incorreto. Tente um termo mais específico.");
  };
  const {
    places,
    categories,
    loading,
    error,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    onlyFree,
    setOnlyFree,
    refresh,
  } = usePlaces();

  const isFirstLoad = loading && places.length === 0;

  return (
    <View style={styles.container}>
      <FlatList
        data={isFirstLoad ? [] : places}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && places.length > 0}
            onRefresh={refresh}
            colors={[theme.colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Encontre lazer perto de você</Text>
              <Text style={styles.subtitle}>
                Explore os pontos turísticos e espaços culturais mais próximos.
              </Text>
            </View>

            {locationLoading && (
              <View style={styles.infoBox}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.infoText}>Obtendo sua localização...</Text>
              </View>
            )}

            {!locationLoading && locationError && (
              <View style={[styles.infoBox, styles.infoBoxWarning]}>
                <View style={styles.locationErrorRow}>
                  <Ionicons name="location-outline" size={18} color={theme.colors.danger} />
                  <Text style={styles.errorText}>Localização desativada</Text>
                  <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
                    <Text style={styles.settingsButtonText}>Ativar GPS</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.orText}>ou informe seu endereço para ver os locais mais próximos:</Text>
                <View style={styles.addressRow}>
                  <TextInput
                    style={styles.addressInput}
                    value={addressInput}
                    onChangeText={setAddressInput}
                    placeholder="Ex: Pinheiros, São Paulo..."
                    placeholderTextColor={theme.colors.textLight}
                    returnKeyType="search"
                    onSubmitEditing={searchAddress}
                  />
                  <TouchableOpacity
                    style={styles.addressButton}
                    onPress={searchAddress}
                    disabled={addressLoading}
                  >
                    {addressLoading
                      ? <ActivityIndicator size="small" color={theme.colors.white} />
                      : <Ionicons name="search" size={18} color={theme.colors.white} />
                    }
                  </TouchableOpacity>
                </View>
                {addressError && (
                  <Text style={styles.addressErrorText}>{addressError}</Text>
                )}

                {foundAddress && (
                  <View style={styles.foundAddressBox}>
                    <View style={styles.foundAddressHeader}>
                      <Ionicons name="location" size={15} color={theme.colors.success} />
                      <Text style={styles.foundAddressTitle}>Endereço encontrado:</Text>
                    </View>
                    <Text style={styles.foundAddressLabel} numberOfLines={2}>
                      {foundAddress.label}
                    </Text>
                    <View style={styles.foundAddressActions}>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={confirmAddress}
                      >
                        <Ionicons name="checkmark" size={15} color={theme.colors.white} />
                        <Text style={styles.confirmButtonText}>Confirmar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={rejectAddress}
                      >
                        <Ionicons name="pencil" size={15} color={theme.colors.primary} />
                        <Text style={styles.rejectButtonText}>Editar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            <SearchBar value={search} onChangeText={setSearch} />

            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />

            <TouchableOpacity
              style={[styles.freeToggle, onlyFree && styles.freeToggleActive]}
              onPress={() => setOnlyFree((prev) => !prev)}
              activeOpacity={0.75}
            >
              <Text style={styles.freeToggleIcon}>🎟️</Text>
              <Text style={[styles.freeToggleText, onlyFree && styles.freeToggleTextActive]}>
                Apenas gratuitos
              </Text>
            </TouchableOpacity>

            {!isFirstLoad && (
              <Text style={styles.sectionTitle}>
                {places.length > 0
                  ? `${places.length} lugares encontrados`
                  : ""}
              </Text>
            )}
          </>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).duration(400)}>
            <PlaceCard
              place={item}
              favorite={isFavorite(item.id)}
              visited={isVisited(item.id)}
              onFavoritePress={() => toggleFavorite(item)}
              onPress={() => navigation.navigate("Details", { placeId: item.id, place: item })}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          isFirstLoad ? (
            // Skeleton loading
            <>
              <Text style={styles.sectionTitle}>Carregando...</Text>
              {[1, 2, 3].map((k) => (
                <SkeletonCard key={k} />
              ))}
            </>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons
                name="wifi-outline"
                size={48}
                color={theme.colors.textLight}
              />
              <Text style={styles.errorTitle}>Sem conexão</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color={theme.colors.textLight}
              />
              <Text style={styles.emptyText}>
                Nenhum local encontrado para essa busca.
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  freeToggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    marginBottom: theme.spacing.sm,
  },
  freeToggleActive: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  freeToggleIcon: {
    fontSize: 14,
  },
  freeToggleText: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 13,
  },
  freeToggleTextActive: {
    color: theme.colors.white,
  },
  sectionTitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textLight,
  },
  infoBox: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoBoxWarning: {
    borderColor: theme.colors.danger,
    backgroundColor: "#FFF5F5",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
  },
  locationErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  orText: {
    fontSize: 13,
    color: theme.colors.textLight,
  },
  addressRow: {
    flexDirection: "row",
    gap: 8,
  },
  addressInput: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: theme.colors.text,
  },
  addressButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  addressErrorText: {
    fontSize: 12,
    color: theme.colors.danger,
  },
  foundAddressBox: {
    backgroundColor: "#F0FBF9",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.success,
    padding: theme.spacing.sm,
    gap: 8,
  },
  foundAddressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  foundAddressTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.success,
  },
  foundAddressLabel: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 18,
  },
  foundAddressActions: {
    flexDirection: "row",
    gap: 8,
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 8,
  },
  rejectButtonText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  settingsButton: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
  },
  settingsButtonText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    marginTop: 8,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: "center",
  },
});
