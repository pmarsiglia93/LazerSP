import api from "./api";

/**
 * Busca lista de lugares com filtros opcionais
 * @param {object} params - { category, search, free, limit, offset }
 */
export async function fetchPlaces(params = {}) {
  const { data } = await api.get("/places", { params });
  return data; // { success, data: [], meta: { total, limit, offset } }
}

/**
 * Busca um lugar pelo ID
 * @param {number} id
 */
export async function fetchPlaceById(id) {
  const { data } = await api.get(`/places/${id}`);
  return data; // { success, data: {} }
}

/**
 * Busca todas as categorias disponíveis
 */
export async function fetchCategories() {
  const { data } = await api.get("/places/categories");
  return data; // { success, data: [] }
}
