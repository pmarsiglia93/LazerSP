import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { FavoritesProvider, useFavorites } from "../FavoritesContext";
import * as userService from "../../services/userService";

let mockAuth = { status: "signedIn", user: { id: 1 } };
jest.mock("../AuthContext", () => ({ useOptionalAuth: () => mockAuth }));

jest.mock("../../services/userService", () => ({
  fetchRemoteFavorites: jest.fn(),
  replaceRemoteFavorites: jest.fn(async () => []),
  addRemoteFavorite: jest.fn(async () => {}),
  removeRemoteFavorite: jest.fn(async () => {}),
}));

const wrapper = ({ children }) => <FavoritesProvider>{children}</FavoritesProvider>;
const local = { id: 1, name: "Local" };
const remoteOnly = { id: 2, name: "Da conta" };

describe("FavoritesContext com login", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockAuth = { status: "signedIn", user: { id: 1 } };
    await AsyncStorage.clear();
    await AsyncStorage.setItem("@lazersp:favorites", JSON.stringify([local]));
    userService.fetchRemoteFavorites.mockResolvedValue([remoteOnly]);
  });

  it("une favoritos do aparelho e da conta e envia a lista unida", async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    await waitFor(() => expect(result.current.favorites.map((p) => p.id)).toEqual([1, 2]));
    expect(userService.replaceRemoteFavorites).toHaveBeenCalledWith([1, 2]);
  });

  it("envia cada favorito marcado ou desmarcado para a conta", async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.favorites).toHaveLength(2));

    act(() => result.current.toggleFavorite({ id: 3, name: "Novo" }));
    expect(userService.addRemoteFavorite).toHaveBeenCalledWith(3);

    act(() => result.current.toggleFavorite(local));
    expect(userService.removeRemoteFavorite).toHaveBeenCalledWith(1);
  });

  it("não chama a conta quando o usuário está deslogado", async () => {
    mockAuth = { status: "signedOut", user: null };
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggleFavorite({ id: 3 }));

    expect(userService.fetchRemoteFavorites).not.toHaveBeenCalled();
    expect(userService.addRemoteFavorite).not.toHaveBeenCalled();
  });

  it("mantém os favoritos locais se a sincronização falhar", async () => {
    userService.fetchRemoteFavorites.mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(userService.fetchRemoteFavorites).toHaveBeenCalled());

    expect(result.current.favorites).toEqual([local]);
  });
});
