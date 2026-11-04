import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { FavoritesProvider, useFavorites } from "../FavoritesContext";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const STORAGE_KEY = "@lazersp:favorites";
const wrapper = ({ children }) => <FavoritesProvider>{children}</FavoritesProvider>;

const parque = { id: 1, name: "Parque", isOpen: true, openingHours: "05:00 - 24:00" };
const bar = { id: 2, name: "Bar", isOpen: false, openingHours: "Ter-Sáb 18:00 - 02:00" };

async function renderFavorites() {
  const hook = renderHook(() => useFavorites(), { wrapper });
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}

describe("FavoritesContext", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("começa vazio e adiciona/remove com toggleFavorite", async () => {
    const { result } = await renderFavorites();
    expect(result.current.favorites).toEqual([]);

    act(() => result.current.toggleFavorite(parque));
    expect(result.current.isFavorite(1)).toBe(true);

    act(() => result.current.toggleFavorite(parque));
    expect(result.current.isFavorite(1)).toBe(false);
  });

  it("persiste no AsyncStorage e carrega ao iniciar", async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([bar]));
    const { result } = await renderFavorites();
    expect(result.current.favorites).toEqual([bar]);

    act(() => result.current.toggleFavorite(parque));
    await waitFor(async () =>
      expect(JSON.parse(await AsyncStorage.getItem(STORAGE_KEY))).toEqual([bar, parque])
    );
  });

  it("syncFavorites atualiza os dados salvos com os vindos da API", async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([parque, bar]));
    const { result } = await renderFavorites();

    act(() => result.current.syncFavorites([{ ...bar, isOpen: true, rating: 4.5 }, { id: 99, name: "Outro" }]));

    expect(result.current.favorites).toEqual([parque, { ...bar, isOpen: true, rating: 4.5 }]);
  });

  it("syncFavorites mantém a mesma referência quando nada muda", async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([parque]));
    const { result } = await renderFavorites();
    const before = result.current.favorites;

    act(() => result.current.syncFavorites([{ id: 42, name: "Não favorito" }]));

    expect(result.current.favorites).toBe(before);
  });

  it("useFavorites fora do provider lança erro claro", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useFavorites())).toThrow("useFavorites deve ser usado dentro de FavoritesProvider");
  });
});
