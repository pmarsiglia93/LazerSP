import { Platform } from "react-native";

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

let module_ = null;
let configured = false;

/**
 * Carrega o módulo nativo sob demanda. No Expo Go e na web ele não existe:
 * nesses casos o login com Google fica indisponível em vez de quebrar o app.
 */
function loadModule() {
  if (module_ !== null) return module_ || null;
  if (Platform.OS === "web" || !WEB_CLIENT_ID) {
    module_ = false;
    return null;
  }
  try {
    module_ = require("@react-native-google-signin/google-signin");
  } catch {
    module_ = false;
  }
  return module_ || null;
}

export function isGoogleSignInAvailable() {
  return loadModule() !== null;
}

function getSignin() {
  const mod = loadModule();
  if (!mod) throw Object.assign(new Error("Login com Google indisponível"), { code: "UNAVAILABLE" });
  if (!configured) {
    // webClientId faz o Google emitir o ID token que o backend valida
    mod.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, iosClientId: IOS_CLIENT_ID });
    configured = true;
  }
  return mod;
}

/**
 * Abre o seletor de contas do Google.
 * @returns {Promise<string|null>} ID token, ou null se o usuário cancelar
 */
export async function signInWithGoogle() {
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = getSignin();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null; // cancelado
    return response.data.idToken;
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return null;
    throw error;
  }
}

export async function signOutFromGoogle() {
  const mod = loadModule();
  if (!mod) return;
  try {
    await getSignin().GoogleSignin.signOut();
  } catch {
    // A sessão do app já foi encerrada; falhar aqui não deve travar o logout
  }
}
