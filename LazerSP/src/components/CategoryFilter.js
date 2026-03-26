import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import theme from "../styles/theme";

const CATEGORY_ICONS = {
  Todos: "🗺️",
  Parques: "🌳",
  Museus: "🏛️",
  Mercados: "🛒",
  "Centros Culturais": "🎭",
  "Pontos Turísticos": "📍",
  Bares: "🍺",
  Baladas: "🎉",
  Restaurantes: "🍽️",
};

export default function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const active = selected === category;
        const icon = CATEGORY_ICONS[category] || "📌";

        return (
          <TouchableOpacity
            key={category}
            style={[styles.button, active && styles.buttonActive]}
            onPress={() => onSelect(category)}
            activeOpacity={0.75}
          >
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[styles.text, active && styles.textActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.sm,
    gap: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  buttonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 13,
  },
  textActive: {
    color: theme.colors.white,
  },
});
