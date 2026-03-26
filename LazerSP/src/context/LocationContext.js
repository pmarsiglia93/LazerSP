import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as Linking from "expo-linking";
import * as Location from "expo-location";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== "granted") {
        setError("Permissão de localização negada.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc.coords);
    } catch (err) {
      setError("Não foi possível obter sua localização.");
      console.error("[LocationContext]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  /**
   * Calcula distância em km usando a fórmula de Haversine
   */
  const getDistance = useCallback(
    (lat, lon) => {
      if (!location) return null;
      const R = 6371;
      const dLat = ((lat - location.latitude) * Math.PI) / 180;
      const dLon = ((lon - location.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((location.latitude * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [location]
  );

  return (
    <LocationContext.Provider
      value={{
        location,
        permissionStatus,
        loading,
        error,
        getDistance,
        requestLocation,
        openSettings,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation deve ser usado dentro de LocationProvider");
  }
  return ctx;
}
