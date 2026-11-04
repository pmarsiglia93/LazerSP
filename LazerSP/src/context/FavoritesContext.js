import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useOptionalAuth } from "./AuthContext";
import {
  addRemoteFavorite,
  fetchRemoteFavorites,
  removeRemoteFavorite,
  replaceRemoteFavorites,
} from "../services/userService";
import { mergeFavorites } from "../utils/sync";

const logSyncError = (error) => {
  if (__DEV__) console.warn("[Favoritos] falha ao sincronizar:", error?.message);
};

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

  // Com login, junta os favoritos do aparelho com os da conta (união)
  const auth = useOptionalAuth();
  const userId = auth?.status === "signedIn" ? auth.user?.id ?? null : null;
  const userIdRef = useRef(userId);
  const favoritesRef = useRef(favorites);
  userIdRef.current = userId;
  favoritesRef.current = favorites;

  useEffect(() => {
    if (!loaded || !userId) return;
    let active = true;
    (async () => {
      try {
        const remote = await fetchRemoteFavorites();
        if (!active) return;
        const merged = mergeFavorites(favoritesRef.current, remote);
        setFavorites(merged);
        await replaceRemoteFavorites(merged.map((p) => p.id));
      } catch (error) {
        logSyncError(error);
      }
    })();
    return () => {
      active = false;
    };
  }, [loaded, userId]);

  const isFavorite = useCallback(
    (placeId) => favorites.some((p) => p.id === placeId),
    [favorites]
  );

  const toggleFavorite = useCallback((place) => {
    const exists = favoritesRef.current.some((p) => p.id === place.id);
    setFavorites((prev) =>
      exists ? prev.filter((p) => p.id !== place.id) : [...prev.filter((p) => p.id !== place.id), place]
    );
    if (userIdRef.current) {
      (exists ? removeRemoteFavorite(place.id) : addRemoteFavorite(place.id)).catch(logSyncError);
    }
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
