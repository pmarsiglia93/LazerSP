import { Ionicons } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, View } from "react-native";

import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import PlaceCard from "../components/PlaceCard";
import { useFavorites } from "../context/FavoritesContext";
import { useVisits } from "../context/VisitsContext";
import theme from "../styles/theme";

export default function FavoritesScreen({ navigation }) {
  const { t } = useTranslation();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { isVisited } = useVisits();

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).duration(400)}>
            <PlaceCard
              place={item}
              favorite={isFavorite(item.id)}
              visited={isVisited(item.id)}
              onFavoritePress={() => toggleFavorite(item)}
              onPress={() =>
                navigation.navigate("Details", { placeId: item.id, place: item })
              }
            />
          </Animated.View>
        )}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{t("favorites.title")}</Text>
            {favorites.length > 0 && (
              <Text style={styles.count}>
                {t(favorites.length === 1 ? "favorites.count_one" : "favorites.count_other", { count: favorites.length })}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={theme.colors.border} />
            <Text style={styles.emptyTitle}>{t("favorites.empty_title")}</Text>
            <Text style={styles.emptyText}>{t("favorites.empty_text")}</Text>
          </View>
        }
        contentContainerStyle={[
          styles.content,
          favorites.length === 0 && styles.contentEmpty,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  contentEmpty: { flexGrow: 1 },
  headerContainer: { marginBottom: theme.spacing.md },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: 4 },
  count: { fontSize: 14, color: theme.colors.textLight, fontWeight: "600" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: theme.colors.text },
  emptyText: { fontSize: 15, color: theme.colors.textLight, textAlign: "center", lineHeight: 24, paddingHorizontal: 32 },
});
