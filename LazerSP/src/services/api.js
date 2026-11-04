import Constants from "expo-constants";
import axios from "axios";
import { Platform } from "react-native";

/** API de produção (HTTPS). Usada nos builds quando EXPO_PUBLIC_API_URL não está definida. */
export const PRODUCTION_API_URL = "https://lazersp-production.up.railway.app/api";

/**
 * Resolve a URL base da API na seguinte ordem de prioridade:
 * 1. Variável de ambiente EXPO_PUBLIC_API_URL (.env local ou `env` do perfil no eas.json)
 * 2. Em desenvolvimento: host do Metro bundler (celular na mesma rede) e,
 *    por fim, emulador Android ou localhost
 * 3. Em builds de release: a API de produção. Builds de release bloqueiam
 *    HTTP sem TLS, então nunca devem cair em um endereço local.
 */
export function getBaseUrl({
  envUrl = process.env.EXPO_PUBLIC_API_URL,
  isDev = __DEV__,
  hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost,
  platform = Platform.OS,
} = {}) {
  if (envUrl) return envUrl;

  if (!isDev) return PRODUCTION_API_URL;

  if (hostUri) {
    const ip = hostUri.split(":")[0];
    // Ignora domínios do modo tunnel (ngrok / exp.direct)
    if (!ip.includes("ngrok") && !ip.includes("exp.direct")) {
      return `http://${ip}:3001/api`;
    }
  }

  return platform === "android"
    ? "http://10.0.2.2:3001/api" // emulador Android
    : "http://localhost:3001/api"; // web / simulador iOS
}

// eslint-disable-next-line import/no-named-as-default-member
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
