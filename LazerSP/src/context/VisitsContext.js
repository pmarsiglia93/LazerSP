import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useOptionalAuth } from "./AuthContext";
import {
  fetchRemoteVisits,
  removeRemoteVisit,
  replaceRemoteVisits,
  saveRemoteVisit,
} from "../services/userService";
import { mergeVisits, visitsToPayload } from "../utils/sync";

const logSyncError = (error) => {
  if (__DEV__) console.warn("[Visitas] falha ao sincronizar:", error?.message);
};

const STORAGE_KEY = "@lazersp:visits";

// Estrutura: { [placeId]: { rating: number|null, note: string, visitedAt: string, updatedAt: string } }
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

  // Com login, junta as visitas do aparelho com as da conta (vence a mais recente)
  const auth = useOptionalAuth();
  const userId = auth?.status === "signedIn" ? auth.user?.id ?? null : null;
  const userIdRef = useRef(userId);
  const visitsRef = useRef(visits);
  userIdRef.current = userId;
  visitsRef.current = visits;

  useEffect(() => {
    if (!loaded || !userId) return;
    let active = true;
    (async () => {
      try {
        const remote = await fetchRemoteVisits();
        if (!active) return;
        const merged = mergeVisits(visitsRef.current, remote);
        setVisits(merged);
        await replaceRemoteVisits(visitsToPayload(merged));
      } catch (error) {
        logSyncError(error);
      }
    })();
    return () => {
      active = false;
    };
  }, [loaded, userId]);

  const isVisited = useCallback(
    (placeId) => Boolean(visits[placeId]),
    [visits]
  );

  const getVisit = useCallback(
    (placeId) => visits[placeId] || null,
    [visits]
  );

  const saveVisit = useCallback((placeId, { rating = null, note = "" } = {}) => {
    const now = new Date().toISOString();
    const visit = {
      rating,
      note,
      visitedAt: visitsRef.current[placeId]?.visitedAt || now,
      updatedAt: now,
    };
    setVisits((prev) => ({ ...prev, [placeId]: visit }));
    if (userIdRef.current) saveRemoteVisit(placeId, visit).catch(logSyncError);
  }, []);

  const removeVisit = useCallback((placeId) => {
    setVisits((prev) => {
      const next = { ...prev };
      delete next[placeId];
      return next;
    });
    if (userIdRef.current) removeRemoteVisit(placeId).catch(logSyncError);
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
