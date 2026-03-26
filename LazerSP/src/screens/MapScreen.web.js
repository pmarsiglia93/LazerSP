import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import theme from "../styles/theme";

// Versão web do MapScreen — react-native-maps não funciona no browser
export default function MapScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Ionicons name="map-outline" size={64} color={theme.colors.border} />
      <Text style={styles.title}>Mapa indisponível na versão web</Text>
      <Text style={styles.subtitle}>
        Para usar o mapa interativo, acesse o app pelo celular usando o Expo Go.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textLight,
    textAlign: "center",
    lineHeight: 24,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    marginTop: 8,
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
