import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Animated, { FadeInDown } from "react-native-reanimated";
import CategoryFilter from "../components/CategoryFilter";
import PlaceCard from "../components/PlaceCard";
import SearchBar from "../components/SearchBar";
import SkeletonCard from "../components/SkeletonCard";
import { useFavorites } from "../context/FavoritesContext";
import { useLocation } from "../context/LocationContext";
import { usePlaces } from "../hooks/usePlaces";
import theme from "../styles/theme";

export default function HomeScreen({ navigation }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { loading: locationLoading, error: locationError, openSettings } = useLocation();
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
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={theme.colors.danger}
                />
                <Text style={styles.errorText}>{locationError}</Text>
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={openSettings}
                >
                  <Text style={styles.settingsButtonText}>Ativar</Text>
                </TouchableOpacity>
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
  settingsButton: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    marginLeft: 4,
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
