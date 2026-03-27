import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import theme from "../styles/theme";

export default function PlaceCard({ place, onPress, onFavoritePress, favorite, visited }) {
  const distanceLabel =
    place.distance !== null && place.distance !== undefined
      ? `${place.distance.toFixed(1)} km`
      : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Imagem com cache automático via expo-image */}
      <Image
        source={{ uri: place.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />

      {/* Badge de status sobreposto à imagem */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: place.isOpen ? theme.colors.success : theme.colors.danger },
        ]}
      >
        <Text style={styles.statusText}>{place.isOpen ? "Aberto" : "Fechado"}</Text>
      </View>

      {visited && (
        <View style={styles.visitedBadge}>
          <Ionicons name="checkmark-circle" size={13} color={theme.colors.white} />
          <Text style={styles.visitedBadgeText}>Visitado</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Nome + Favorito */}
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
          <TouchableOpacity onPress={onFavoritePress} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={22}
              color={favorite ? theme.colors.danger : theme.colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* Categoria */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{place.category}</Text>
        </View>

        {/* Endereço */}
        <Text style={styles.address} numberOfLines={1}>{place.address}</Text>

        {/* Distância */}
        {distanceLabel && (
          <View style={styles.distanceRow}>
            <Ionicons name="navigate-outline" size={13} color={theme.colors.success} />
            <Text style={styles.distance}>{distanceLabel} de você</Text>
          </View>
        )}

        {/* Meta: rating + preço */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.rating}>⭐ {place.rating}</Text>
          </View>
          <View style={styles.metaDivider} />
          <Text style={styles.price}>{place.priceLevel}</Text>
        </View>

        {/* Destaque */}
        <Text style={styles.highlight} numberOfLines={2}>{place.highlight}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 185,
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  visitedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2A9D8F",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  visitedBadgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
    marginRight: 8,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary + "15",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  address: {
    fontSize: 13,
    color: theme.colors.textLight,
    marginBottom: 6,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  distance: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.success,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  price: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  highlight: {
    fontSize: 13,
    color: theme.colors.textLight,
    fontStyle: "italic",
    lineHeight: 20,
  },
});
