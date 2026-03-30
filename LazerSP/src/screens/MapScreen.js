import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

import { useLocation } from "../context/LocationContext";
import { fetchPlaces } from "../services/placesService";
import theme from "../styles/theme";

export default function MapScreen({ navigation }) {
  const { location, error: locationError, getDistance } = useLocation();
  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);

  useEffect(() => {
    fetchPlaces({ limit: 100 })
      .then((res) => setPlaces(res.data))
      .catch(console.error)
      .finally(() => setLoadingPlaces(false));
  }, []);

  const initialRegion = useMemo(() => {
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };
    }
    return {
      latitude: -23.5505,
      longitude: -46.6333,
      latitudeDelta: 0.18,
      longitudeDelta: 0.18,
    };
  }, [location]);

  const isLoading = loadingPlaces;

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando mapa...</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {places.filter((place) => place.latitude != null && place.longitude != null).map((place) => {
            const distance = getDistance(place.latitude, place.longitude);
            const distanceLabel = distance !== null ? `${distance.toFixed(1)} km` : "";
            return (
              <Marker
                key={place.id}
                coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                title={place.name}
                description={`${place.category}${distanceLabel ? ` • ${distanceLabel}` : ""}`}
                onCalloutPress={() =>
                  navigation.navigate("Details", { placeId: place.id, place })
                }
              />
            );
          })}
        </MapView>
      )}

      <View style={styles.overlay}>
        <View style={styles.overlayHeader}>
          <Ionicons name="map" size={18} color={theme.colors.primary} />
          <Text style={styles.title}>Mapa de pontos próximos</Text>
        </View>
        <Text style={styles.subtitle}>
          Toque em um marcador e depois em "Saiba mais" para ver o local.
        </Text>

        {locationError && (
          <View style={styles.errorRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.danger} />
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    color: theme.colors.textLight,
    fontSize: 15,
  },
  overlay: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textLight,
    marginBottom: 12,
    lineHeight: 20,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});
