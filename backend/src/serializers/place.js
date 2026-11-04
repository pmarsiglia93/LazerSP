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
 * Converte uma linha da tabela places no formato da API.
 * `isOpen` vem do horário de funcionamento; o campo `is_open` do banco só é
 * usado quando o horário não pode ser interpretado.
 */
function formatPlace(row, tags = []) {
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
    isOpen: isOpenNow(row.opening_hours) ?? row.is_open === 1,
    latitude: row.latitude,
    longitude: row.longitude,
    instagram: row.instagram || null,
    tags,
    createdAt: row.created_at,
  };
}

/** Busca um lugar com suas tags já formatado, ou null. */
function findPlace(db, id) {
  const row = db.prepare("SELECT * FROM places WHERE id = ?").get(id);
  if (!row) return null;
  return formatPlace(row, loadTags(db, [row.id]).get(row.id));
}

module.exports = { formatPlace, loadTags, findPlace };
