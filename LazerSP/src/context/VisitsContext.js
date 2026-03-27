import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@lazersp:visits";

// Estrutura: { [placeId]: { rating: number|null, note: string, visitedAt: string } }
const VisitsContext = createContext(null);

export function VisitsProvider({ children }) {
  const [visits, setVisits] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) setVisits(JSON.parse(json));
      })
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(visits)).catch(console.error);
  }, [visits, loaded]);

  const isVisited = useCallback(
    (placeId) => Boolean(visits[placeId]),
    [visits]
  );

  const getVisit = useCallback(
    (placeId) => visits[placeId] || null,
    [visits]
  );

  const saveVisit = useCallback((placeId, { rating = null, note = "" } = {}) => {
    setVisits((prev) => ({
      ...prev,
      [placeId]: {
        rating,
        note,
        visitedAt: prev[placeId]?.visitedAt || new Date().toISOString(),
      },
    }));
  }, []);

  const removeVisit = useCallback((placeId) => {
    setVisits((prev) => {
      const next = { ...prev };
      delete next[placeId];
      return next;
    });
  }, []);

  const toggleVisited = useCallback(
    (placeId) => {
      if (visits[placeId]) {
        removeVisit(placeId);
      } else {
        saveVisit(placeId);
      }
    },
    [visits, saveVisit, removeVisit]
  );

  return (
    <VisitsContext.Provider
      value={{ visits, isVisited, getVisit, saveVisit, removeVisit, toggleVisited, loaded }}
    >
      {children}
    </VisitsContext.Provider>
  );
}

export function useVisits() {
  const ctx = useContext(VisitsContext);
  if (!ctx) {
    throw new Error("useVisits deve ser usado dentro de VisitsProvider");
  }
  return ctx;
}
