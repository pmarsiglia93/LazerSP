import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import theme from "../styles/theme";

export default function SearchBar({ value, onChangeText }) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Ionicons
        name="search-outline"
        size={20}
        color={theme.colors.textLight}
        style={styles.icon}
      />
      <TextInput
        placeholder={t("search.placeholder")}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholderTextColor={theme.colors.textLight}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} style={styles.clearBtn}>
          <Ionicons name="close-circle" size={18} color={theme.colors.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.text,
  },
  clearBtn: {
    marginLeft: 6,
    padding: 2,
  },
});
