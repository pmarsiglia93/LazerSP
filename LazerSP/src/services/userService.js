import api from "./api";

// ─── Conta ─────────────────────────────────────────────────────────────────

export async function loginWithGoogle(idToken) {
  const { data } = await api.post("/auth/google", { idToken });
  return data; // { token, user }
}

export async function fetchMe() {
  const { data } = await api.get("/me");
  return data.data;
}

export async function deleteAccount() {
  await api.delete("/me");
}

// ─── Favoritos ─────────────────────────────────────────────────────────────

export async function fetchRemoteFavorites() {
  const { data } = await api.get("/me/favorites");
  return data.data; // lugares completos
}

export async function replaceRemoteFavorites(placeIds) {
  const { data } = await api.put("/me/favorites", { placeIds });
  return data.data;
}

export const addRemoteFavorite = (placeId) => api.put(`/me/favorites/${placeId}`);
export const removeRemoteFavorite = (placeId) => api.delete(`/me/favorites/${placeId}`);

// ─── Visitas ───────────────────────────────────────────────────────────────

export async function fetchRemoteVisits() {
  const { data } = await api.get("/me/visits");
  return data.data;
}

export async function replaceRemoteVisits(visits) {
  const { data } = await api.put("/me/visits", { visits });
  return data.data;
}

export const saveRemoteVisit = (placeId, visit) => api.put(`/me/visits/${placeId}`, visit);
export const removeRemoteVisit = (placeId) => api.delete(`/me/visits/${placeId}`);

// ─── Avaliações ────────────────────────────────────────────────────────────

export async function fetchReviews(placeId, { limit = 20, offset = 0 } = {}) {
  const { data } = await api.get(`/places/${placeId}/reviews`, { params: { limit, offset } });
  return data; // { data, mine, meta }
}

export async function saveReview(placeId, { rating, comment }) {
  const { data } = await api.put(`/places/${placeId}/reviews`, { rating, comment });
  return data.data;
}

export const deleteReview = (placeId) => api.delete(`/places/${placeId}/reviews`);
