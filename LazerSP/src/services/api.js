import Constants from "expo-constants";
import axios from "axios";
import { Platform } from "react-native";

/**
 * Resolve a URL base da API na seguinte ordem de prioridade:
 * 1. Variável de ambiente EXPO_PUBLIC_API_URL (.env) — mais confiável
 * 2. Host do Metro bundler — funciona em modo LAN com celular na mesma rede
 * 3. Fallback por plataforma (emulador Android / web / iOS simulator)
 */
function getBaseUrl() {
  // 1. Variável de ambiente definida no .env
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Host do Metro bundler (modo LAN — celular na mesma rede)
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;

  if (debuggerHost) {
    const ip = debuggerHost.split(":")[0];
    // Ignora se for domínio ngrok (modo tunnel)
    if (!ip.includes("ngrok") && !ip.includes("exp.direct")) {
      return `http://${ip}:3001/api`;
    }
  }

  // 3. Fallback por plataforma
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3001/api"; // emulador Android
  }

  return "http://localhost:3001/api"; // web / simulador iOS
}

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

if (__DEV__) {
  console.log("[API] baseURL:", api.defaults.baseURL);
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (__DEV__) {
      console.error("[API Error]", error.config?.url, error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
