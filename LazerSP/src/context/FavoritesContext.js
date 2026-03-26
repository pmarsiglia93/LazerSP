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

  return (
    <FavoritesContext.Provider
      value={{ favorites, isFavorite, toggleFavorite, loaded }}
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
