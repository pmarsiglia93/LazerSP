import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import theme from "../styles/theme";

export default function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.image} />
      <View style={styles.content}>
        <View style={styles.titleBar} />
        <View style={styles.subtitleBar} />
        <View style={styles.shortBar} />
        <View style={styles.metaRow}>
          <View style={styles.metaBar} />
          <View style={styles.metaBar} />
        </View>
      </View>
    </Animated.View>
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
  },
  image: {
    width: "100%",
    height: 185,
    backgroundColor: theme.colors.border,
  },
  content: {
    padding: theme.spacing.md,
    gap: 10,
  },
  titleBar: {
    height: 18,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
    width: "70%",
  },
  subtitleBar: {
    height: 14,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
    width: "50%",
  },
  shortBar: {
    height: 14,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
    width: "90%",
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  metaBar: {
    height: 14,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
    width: 60,
  },
});
