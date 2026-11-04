import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@lazersp:favorites";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Carrega favoritos do AsyncStorage ao iniciar
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) setFavorites(JSON.parse(json));
      })
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  // Salva no AsyncStorage sempre que favoritos mudam
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)).catch(
      console.error
    );
  }, [favorites, loaded]);

  const isFavorite = useCallback(
    (placeId) => favorites.some((p) => p.id === placeId),
    [favorites]
  );

  const toggleFavorite = useCallback((place) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === place.id);
      return exists ? prev.filter((p) => p.id !== place.id) : [...prev, place];
    });
  }, []);

  /**
   * Substitui os dados salvos dos favoritos pelos recebidos da API
   * (horário, status, avaliação...). Lugares que não vieram na lista ficam como estão.
   */
  const syncFavorites = useCallback((freshPlaces) => {
    if (!Array.isArray(freshPlaces) || freshPlaces.length === 0) return;
    const byId = new Map(freshPlaces.map((p) => [p.id, p]));
    setFavorites((prev) => {
      let changed = false;
      const next = prev.map((fav) => {
        const fresh = byId.get(fav.id);
        if (!fresh) return fav;
        changed = true;
        return { ...fav, ...fresh };
      });
      return changed ? next : prev;
    });
  }, []);

  return (
    <FavoritesContext.Provider
      value={{ favorites, isFavorite, toggleFavorite, syncFavorites, loaded }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  }
  return ctx;
}
