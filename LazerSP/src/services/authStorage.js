import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "lazersp.authToken";

// Token em memória, lido pelo interceptor do axios a cada requisição
let currentToken = null;

export function getAuthToken() {
  return currentToken;
}

/** No aparelho o token fica no armazenamento seguro; na web, no AsyncStorage. */
const storage =
  Platform.OS === "web"
    ? {
        get: () => AsyncStorage.getItem(TOKEN_KEY),
        set: (value) => AsyncStorage.setItem(TOKEN_KEY, value),
        remove: () => AsyncStorage.removeItem(TOKEN_KEY),
      }
    : {
        get: () => SecureStore.getItemAsync(TOKEN_KEY),
        set: (value) => SecureStore.setItemAsync(TOKEN_KEY, value),
        remove: () => SecureStore.deleteItemAsync(TOKEN_KEY),
      };

export async function loadAuthToken() {
  try {
    currentToken = (await storage.get()) || null;
  } catch {
    currentToken = null;
  }
  return currentToken;
}

export async function saveAuthToken(token) {
  currentToken = token;
  await storage.set(token);
}

export async function clearAuthToken() {
  currentToken = null;
  try {
    await storage.remove();
  } catch {
    // Nada a fazer: o token em memória já foi descartado
  }
}
