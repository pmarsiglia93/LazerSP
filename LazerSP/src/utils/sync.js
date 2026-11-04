/**
 * Regras de junção entre os dados salvos no aparelho e os da conta.
 * Nada é apagado ao entrar: o resultado é sempre a união dos dois lados.
 */

/**
 * Une os favoritos locais (lugares salvos no aparelho) com os da conta.
 * Mantém a ordem local e acrescenta os que só existem na conta; quando o
 * lugar está nos dois, prevalecem os dados da conta, que vêm atualizados da API.
 * @param {object[]} local
 * @param {object[]} remote
 * @returns {object[]}
 */
export function mergeFavorites(local, remote) {
  const remoteById = new Map(remote.map((p) => [p.id, p]));
  const merged = local.map((p) => (remoteById.has(p.id) ? { ...p, ...remoteById.get(p.id) } : p));
  const localIds = new Set(local.map((p) => p.id));
  for (const place of remote) if (!localIds.has(place.id)) merged.push(place);
  return merged;
}

const timestamp = (visit) => Date.parse(visit?.updatedAt || visit?.visitedAt || 0) || 0;

/**
 * Une as visitas locais ({ [placeId]: visita }) com as da conta (lista).
 * Quando a mesma visita existe nos dois lados, vence a editada por último.
 * @param {Record<string, object>} local
 * @param {object[]} remote
 * @returns {Record<string, object>}
 */
export function mergeVisits(local, remote) {
  const merged = { ...local };
  for (const { placeId, ...visit } of remote) {
    const current = merged[placeId];
    if (!current || timestamp(visit) > timestamp(current)) merged[placeId] = visit;
  }
  return merged;
}

/** Converte o mapa local de visitas no formato da API. */
export function visitsToPayload(visits) {
  return Object.entries(visits).map(([placeId, v]) => ({
    placeId: Number(placeId),
    rating: v.rating ?? null,
    note: v.note ?? "",
    visitedAt: v.visitedAt,
    updatedAt: v.updatedAt || v.visitedAt,
  }));
}
