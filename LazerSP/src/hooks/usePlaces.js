import { useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import { fetchPlaces, fetchCategories } from "../services/placesService";
import { useLocation } from "../context/LocationContext";

export function usePlaces() {
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState(["Todos"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [onlyFree, setOnlyFree] = useState(false);

  const { getDistance } = useLocation();
  const debounceRef = useRef(null);

  // Carrega categorias uma vez
  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.data))
      .catch(console.error);
  }, []);

  const loadPlaces = useCallback(
    async (searchTerm, category, free) => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (category && category !== "Todos") params.category = category;
        if (free) params.free = "true";

        const res = await fetchPlaces(params);

        // Adiciona distância e ordena por proximidade
        const placesWithDistance = res.data.map((place) => ({
          ...place,
          distance: getDistance(place.latitude, place.longitude),
        }));

        placesWithDistance.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

        setPlaces(placesWithDistance);
      } catch (err) {
        setError("Não foi possível carregar os lugares. Verifique sua conexão.");
      } finally {
        setLoading(false);
      }
    },
    [getDistance]
  );

  // Debounce na busca por texto, categoria e filtro de preço
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadPlaces(search, selectedCategory, onlyFree);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, selectedCategory, onlyFree, loadPlaces]);

  // Atualiza os lugares quando o app volta ao primeiro plano
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        loadPlaces(search, selectedCategory, onlyFree);
      }
    });
    return () => subscription.remove();
  }, [loadPlaces, search, selectedCategory, onlyFree]);

  const refresh = useCallback(
    () => loadPlaces(search, selectedCategory, onlyFree),
    [loadPlaces, search, selectedCategory, onlyFree]
  );

  return {
    places,
    categories,
    loading,
    error,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    onlyFree,
    setOnlyFree,
    refresh,
  };
}
