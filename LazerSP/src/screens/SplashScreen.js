import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import theme from "../styles/theme";

export default function SplashScreen({ navigation }) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="map" size={52} color={theme.colors.secondary} />
        </View>

        <Text style={styles.logo}>LazerSP</Text>
        <Text style={styles.tagline}>{t("splash.tagline")}</Text>

        <View style={styles.features}>
          {[
            { icon: "location-outline", key: "splash.feature_nearby" },
            { icon: "star-outline", key: "splash.feature_rated" },
            { icon: "heart-outline", key: "splash.feature_favorites" },
          ].map(({ icon, key }) => (
            <View key={key} style={styles.featureRow}>
              <Ionicons name={icon} size={18} color={theme.colors.secondary} />
              <Text style={styles.featureText}>{t(key)}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace("Main")}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{t("splash.explore_button")}</Text>
          <Ionicons name="arrow-forward" size={18} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={styles.footer}>{t("splash.footer")}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: -80,
    right: -80,
  },
  circle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -60,
    left: -60,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logo: {
    fontSize: 44,
    fontWeight: "800",
    color: theme.colors.white,
    marginBottom: 8,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 36,
    textAlign: "center",
  },
  features: {
    width: "100%",
    gap: 14,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "500",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    width: "100%",
    justifyContent: "center",
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
  },
  footer: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "500",
  },
});
