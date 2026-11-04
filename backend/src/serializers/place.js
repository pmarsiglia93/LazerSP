const { isOpenNow } = require("../utils/openingHours");

/**
 * Busca as tags de vários lugares em uma única query (evita N+1).
 * @param {import("better-sqlite3").Database} db
 * @param {number[]} placeIds
 * @returns {Map<number, string[]>}
 */
function loadTags(db, placeIds) {
  const tagsByPlace = new Map(placeIds.map((id) => [id, []]));
  if (placeIds.length === 0) return tagsByPlace;

  const placeholders = placeIds.map(() => "?").join(", ");
  const rows = db
    .prepare(`SELECT place_id, name FROM tags WHERE place_id IN (${placeholders}) ORDER BY id`)
    .all(...placeIds);

  for (const row of rows) tagsByPlace.get(row.place_id).push(row.name);
  return tagsByPlace;
}

/**
 * Média e quantidade de avaliações publicadas de vários lugares, em uma consulta.
 * @returns {Map<number, { average: number|null, count: number }>}
 */
function loadReviewSummaries(db, placeIds) {
  const summaries = new Map(placeIds.map((id) => [id, { average: null, count: 0 }]));
  if (placeIds.length === 0) return summaries;

  const placeholders = placeIds.map(() => "?").join(", ");
  const rows = db
    .prepare(`
      SELECT place_id, COUNT(*) AS count, AVG(rating) AS average
      FROM reviews
      WHERE status = 'published' AND place_id IN (${placeholders})
      GROUP BY place_id
    `)
    .all(...placeIds);

  for (const row of rows) {
    summaries.set(row.place_id, { average: Math.round(row.average * 10) / 10, count: row.count });
  }
  return summaries;
}

/** Tags e resumo de avaliações de uma lista de linhas, formatadas para a API. */
function formatPlaces(db, rows) {
  const ids = rows.map((r) => r.id);
  const tags = loadTags(db, ids);
  const reviews = loadReviewSummaries(db, ids);
  return rows.map((row) => formatPlace(row, tags.get(row.id), reviews.get(row.id)));
}

/**
 * Status de aberto/fechado:
 * - calculado pelo horário de funcionamento quando ele pode ser interpretado;
 * - `null` quando o horário é texto livre ("Conforme programação");
 * - o campo manual `is_open` só vale quando o horário está vazio.
 */
function resolveIsOpen(row) {
  const computed = isOpenNow(row.opening_hours);
  if (computed !== null) return computed;
  return row.opening_hours ? null : row.is_open === 1;
}

/** Converte uma linha da tabela places no formato da API. */
function formatPlace(row, tags = [], reviews = { average: null, count: 0 }) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    address: row.address,
    description: row.description,
    imageUrl: row.image_url,
    rating: row.rating,
    openingHours: row.opening_hours,
    priceLevel: row.price_level,
    highlight: row.highlight,
    isOpen: resolveIsOpen(row),
    latitude: row.latitude,
    longitude: row.longitude,
    instagram: row.instagram || null,
    tags,
    reviews,
    createdAt: row.created_at,
  };
}

/** Busca um lugar com suas tags já formatado, ou null. */
function findPlace(db, id) {
  const row = db.prepare("SELECT * FROM places WHERE id = ?").get(id);
  if (!row) return null;
  return formatPlaces(db, [row])[0];
}

module.exports = { formatPlace, formatPlaces, loadTags, loadReviewSummaries, findPlace };
