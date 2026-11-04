import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { haversineKm } from "../utils/distance";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // true quando a tentativa de obter localização terminou (com ou sem sucesso)
  const [resolved, setResolved] = useState(false);

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
      setResolved(true);
    }
  }, []);

  // Permite definir localização manualmente (ex: via busca de endereço)
  const setManualLocation = useCallback((coords) => {
    setLocation(coords);
    setError(null);
    setResolved(true);
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  /** Distância em km da posição atual até o ponto, ou null sem localização */
  const getDistance = useCallback(
    (lat, lon) => (location ? haversineKm(location, { latitude: lat, longitude: lon }) : null),
    [location]
  );

  return (
    <LocationContext.Provider
      value={{
        location,
        permissionStatus,
        loading,
        error,
        resolved,
        getDistance,
        requestLocation,
        setManualLocation,
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
