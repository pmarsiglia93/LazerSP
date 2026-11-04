import { act, renderHook, waitFor } from "@testing-library/react-native";

import { usePlaces } from "../usePlaces";
import { fetchCategories, fetchPlaces } from "../../services/placesService";

jest.mock("../../services/placesService", () => ({
  fetchPlaces: jest.fn(),
  fetchCategories: jest.fn(),
}));

const mockSyncFavorites = jest.fn();
jest.mock("../../context/FavoritesContext", () => ({
  useFavorites: () => ({ syncFavorites: mockSyncFavorites }),
}));

// Distância simulada: igual ao id do lugar; o lugar 99 não tem coordenadas
const mockGetDistance = (lat) => (lat === null ? null : lat);
jest.mock("../../context/LocationContext", () => ({
  useLocation: () => ({ getDistance: mockGetDistance, resolved: true }),
}));

const PLACES = [
  { id: 3, name: "Longe", latitude: 30 },
  { id: 99, name: "Sem coordenada", latitude: null },
  { id: 1, name: "Perto", latitude: 1 },
];

describe("usePlaces", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    fetchCategories.mockResolvedValue({ data: ["Todos", "Bares", "Parques"] });
    fetchPlaces.mockResolvedValue({ data: PLACES, meta: { total: 3 } });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function renderAndLoad() {
    const hook = renderHook(() => usePlaces());
    await act(async () => {
      jest.advanceTimersByTime(400); // debounce
    });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    return hook;
  }

  it("carrega categorias e lugares ordenados por distância", async () => {
    const { result } = await renderAndLoad();

    expect(result.current.categories).toEqual(["Todos", "Bares", "Parques"]);
    expect(result.current.places.map((p) => p.name)).toEqual(["Perto", "Longe", "Sem coordenada"]);
    expect(result.current.places[0].distance).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("atualiza os favoritos com os dados recebidos", async () => {
    await renderAndLoad();
    expect(mockSyncFavorites).toHaveBeenCalledWith(PLACES);
  });

  it("envia os filtros para a API e ignora a categoria Todos", async () => {
    const { result } = await renderAndLoad();
    expect(fetchPlaces).toHaveBeenLastCalledWith({});

    act(() => {
      result.current.setSearch("parque");
      result.current.setSelectedCategory("Parques");
      result.current.setOnlyFree(true);
    });
    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() =>
      expect(fetchPlaces).toHaveBeenLastCalledWith({ search: "parque", category: "Parques", free: "true" })
    );
  });

  it("agrupa digitação rápida em uma única busca (debounce)", async () => {
    const { result } = await renderAndLoad();
    fetchPlaces.mockClear();

    for (const term of ["p", "pa", "par"]) {
      act(() => result.current.setSearch(term));
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }
    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => expect(fetchPlaces).toHaveBeenCalledTimes(1));
    expect(fetchPlaces).toHaveBeenCalledWith({ search: "par" });
  });

  it("mostra mensagem de erro quando a API falha", async () => {
    fetchPlaces.mockRejectedValue(new Error("Network Error"));
    const { result } = await renderAndLoad();
    expect(result.current.error).toBe("Não foi possível carregar os lugares. Verifique sua conexão.");
    expect(result.current.places).toEqual([]);
  });
});
