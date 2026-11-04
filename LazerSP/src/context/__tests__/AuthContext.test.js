import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { AuthProvider, useAuth } from "../AuthContext";
import * as authStorage from "../../services/authStorage";
import * as googleAuth from "../../services/googleAuth";
import * as userService from "../../services/userService";

jest.mock("../../services/authStorage", () => {
  let token = null;
  return {
    getAuthToken: () => token,
    loadAuthToken: jest.fn(async () => token),
    saveAuthToken: jest.fn(async (t) => {
      token = t;
    }),
    clearAuthToken: jest.fn(async () => {
      token = null;
    }),
    __setToken: (t) => {
      token = t;
    },
  };
});

jest.mock("../../services/googleAuth", () => ({
  isGoogleSignInAvailable: jest.fn(() => true),
  signInWithGoogle: jest.fn(),
  signOutFromGoogle: jest.fn(async () => {}),
}));

jest.mock("../../services/userService", () => ({
  loginWithGoogle: jest.fn(),
  fetchMe: jest.fn(),
  deleteAccount: jest.fn(),
}));

const { __setToken: setStoredToken } = jest.requireMock("../../services/authStorage");

const USER = { id: 7, email: "ana@example.com", name: "Ana Lima", avatarUrl: null };
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

async function renderAuth() {
  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.status).not.toBe("loading"));
  return hook;
}

describe("AuthContext", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    setStoredToken(null);
    await AsyncStorage.clear();
  });

  it("começa deslogado quando não há sessão salva", async () => {
    const { result } = await renderAuth();
    expect(result.current.status).toBe("signedOut");
    expect(result.current.user).toBeNull();
    expect(result.current.available).toBe(true);
  });

  it("entra com Google, salva o token e o perfil", async () => {
    googleAuth.signInWithGoogle.mockResolvedValue("id-token-google");
    userService.loginWithGoogle.mockResolvedValue({ token: "jwt-app", user: USER });
    const { result } = await renderAuth();

    let ok;
    await act(async () => {
      ok = await result.current.signIn();
    });

    expect(ok).toBe(true);
    expect(userService.loginWithGoogle).toHaveBeenCalledWith("id-token-google");
    expect(authStorage.saveAuthToken).toHaveBeenCalledWith("jwt-app");
    expect(result.current).toMatchObject({ status: "signedIn", user: USER });
  });

  it("não faz nada quando o usuário cancela o seletor do Google", async () => {
    googleAuth.signInWithGoogle.mockResolvedValue(null);
    const { result } = await renderAuth();

    let ok;
    await act(async () => {
      ok = await result.current.signIn();
    });

    expect(ok).toBe(false);
    expect(userService.loginWithGoogle).not.toHaveBeenCalled();
    expect(result.current.status).toBe("signedOut");
  });

  it("restaura a sessão salva e atualiza o perfil pelo servidor", async () => {
    setStoredToken("jwt-salvo");
    await AsyncStorage.setItem("@lazersp:user", JSON.stringify({ ...USER, name: "Nome antigo" }));
    userService.fetchMe.mockResolvedValue(USER);

    const { result } = await renderAuth();

    expect(result.current.status).toBe("signedIn");
    await waitFor(() => expect(result.current.user.name).toBe("Ana Lima"));
  });

  it("continua logado sem rede, com o perfil em cache", async () => {
    setStoredToken("jwt-salvo");
    await AsyncStorage.setItem("@lazersp:user", JSON.stringify(USER));
    userService.fetchMe.mockRejectedValue(new Error("Network Error"));

    const { result } = await renderAuth();
    await waitFor(() => expect(userService.fetchMe).toHaveBeenCalled());

    expect(result.current).toMatchObject({ status: "signedIn", user: USER });
  });

  it("encerra a sessão quando o servidor responde 401", async () => {
    setStoredToken("jwt-expirado");
    await AsyncStorage.setItem("@lazersp:user", JSON.stringify(USER));
    userService.fetchMe.mockRejectedValue({ response: { status: 401 } });

    const { result } = await renderAuth();

    await waitFor(() => expect(result.current.status).toBe("signedOut"));
    expect(authStorage.clearAuthToken).toHaveBeenCalled();
  });

  it("sai da conta e limpa a sessão", async () => {
    googleAuth.signInWithGoogle.mockResolvedValue("id-token-google");
    userService.loginWithGoogle.mockResolvedValue({ token: "jwt-app", user: USER });
    const { result } = await renderAuth();
    await act(async () => {
      await result.current.signIn();
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(googleAuth.signOutFromGoogle).toHaveBeenCalled();
    expect(result.current).toMatchObject({ status: "signedOut", user: null });
    expect(await AsyncStorage.getItem("@lazersp:user")).toBeNull();
  });

  it("exclui a conta no servidor antes de encerrar a sessão", async () => {
    googleAuth.signInWithGoogle.mockResolvedValue("id-token-google");
    userService.loginWithGoogle.mockResolvedValue({ token: "jwt-app", user: USER });
    userService.deleteAccount.mockResolvedValue();
    const { result } = await renderAuth();
    await act(async () => {
      await result.current.signIn();
    });

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(userService.deleteAccount).toHaveBeenCalled();
    expect(result.current.status).toBe("signedOut");
  });

  it("mantém o login se a exclusão falhar", async () => {
    googleAuth.signInWithGoogle.mockResolvedValue("id-token-google");
    userService.loginWithGoogle.mockResolvedValue({ token: "jwt-app", user: USER });
    userService.deleteAccount.mockRejectedValue(new Error("500"));
    const { result } = await renderAuth();
    await act(async () => {
      await result.current.signIn();
    });

    await act(async () => {
      await expect(result.current.deleteAccount()).rejects.toThrow("500");
    });

    expect(result.current.status).toBe("signedIn");
  });
});
