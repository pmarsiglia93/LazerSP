import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { setUnauthorizedHandler } from "../services/api";
import { clearAuthToken, loadAuthToken, saveAuthToken } from "../services/authStorage";
import { isGoogleSignInAvailable, signInWithGoogle, signOutFromGoogle } from "../services/googleAuth";
import * as userService from "../services/userService";

const AuthContext = createContext(null);
const USER_KEY = "@lazersp:user";

async function readCachedUser() {
  try {
    const json = await AsyncStorage.getItem(USER_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

const cacheUser = (user) => AsyncStorage.setItem(USER_KEY, JSON.stringify(user)).catch(() => {});

/**
 * Login opcional com Google. O app funciona sem conta; com conta, favoritos e
 * visitas são sincronizados e o usuário pode publicar avaliações.
 *
 * status: "loading" (lendo sessão salva) | "signedOut" | "signedIn"
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [busy, setBusy] = useState(false);

  const endSession = useCallback(async () => {
    await clearAuthToken();
    await AsyncStorage.removeItem(USER_KEY).catch(() => {});
    setUser(null);
    setStatus("signedOut");
  }, []);

  // Restaura a sessão salva no aparelho. O perfil em cache permite abrir o
  // app logado mesmo sem rede; o servidor confirma a sessão em seguida.
  useEffect(() => {
    let active = true;
    (async () => {
      const token = await loadAuthToken();
      const cached = token ? await readCachedUser() : null;
      if (!active) return;
      if (!token || !cached) {
        if (token) await clearAuthToken();
        setStatus("signedOut");
        return;
      }
      setUser(cached);
      setStatus("signedIn");
      try {
        const me = await userService.fetchMe();
        if (active) {
          setUser(me);
          cacheUser(me);
        }
      } catch (error) {
        if (active && error.response?.status === 401) await endSession();
      }
    })();
    return () => {
      active = false;
    };
  }, [endSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      endSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  /** @returns {Promise<boolean>} true se entrou; false se o usuário cancelou */
  const signIn = useCallback(async () => {
    setBusy(true);
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) return false;
      const { token, user: me } = await userService.loginWithGoogle(idToken);
      await saveAuthToken(token);
      cacheUser(me);
      setUser(me);
      setStatus("signedIn");
      return true;
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutFromGoogle();
    await endSession();
  }, [endSession]);

  /** Exclui a conta no servidor. Os dados salvos no aparelho continuam. */
  const deleteAccount = useCallback(async () => {
    setBusy(true);
    try {
      await userService.deleteAccount();
      await signOutFromGoogle();
      await endSession();
    } finally {
      setBusy(false);
    }
  }, [endSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      busy,
      available: isGoogleSignInAvailable(),
      signIn,
      signOut,
      deleteAccount,
    }),
    [user, status, busy, signIn, signOut, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

/** Versão tolerante: fora do AuthProvider (ex.: testes) devolve null. */
export function useOptionalAuth() {
  return useContext(AuthContext);
}
