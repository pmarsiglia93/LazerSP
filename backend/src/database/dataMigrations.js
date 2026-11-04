/**
 * Migrações de dados: lotes de lugares adicionados depois do seed inicial.
 *
 * Cada lote roda uma única vez por banco (registrado em data_migrations).
 * Assim, um lugar removido pelo painel depois da migração não volta a ser
 * inserido. Lugares com o mesmo nome de um já existente são ignorados, para
 * não duplicar cadastros feitos manualmente.
 */
const { initDb } = require("./db");
const { NOVOS_LUGARES } = require("./data/2026-11-novos-lugares");

const MIGRATIONS = [{ id: "2026-11-novos-lugares", places: NOVOS_LUGARES }];

const normalize = (name) => name.trim().toLocaleLowerCase("pt-BR");

/**
 * Aplica os lotes pendentes.
 * @param {{ migrations?: Array<{ id: string, places: object[] }> }} [options]
 * @returns {Array<{ id: string, inserted: number, skipped: string[] }>} lotes aplicados agora
 */
function applyDataMigrations({ migrations = MIGRATIONS } = {}) {
  const db = initDb();
  const isApplied = db.prepare("SELECT 1 FROM data_migrations WHERE id = ?");
  const markApplied = db.prepare("INSERT INTO data_migrations (id) VALUES (?)");
  const insertPlace = db.prepare(`
    INSERT INTO places (name, category, address, description, image_url, rating, opening_hours, price_level, highlight, is_open, latitude, longitude, instagram)
    VALUES (@name, @category, @address, @description, @image_url, 0, @opening_hours, @price_level, @highlight, 1, @latitude, @longitude, @instagram)
  `);
  const insertTag = db.prepare("INSERT INTO tags (place_id, name) VALUES (?, ?)");

  const results = [];

  for (const migration of migrations) {
    if (isApplied.get(migration.id)) continue;

    const run = db.transaction(() => {
      const existing = new Set(
        db.prepare("SELECT name FROM places").all().map((r) => normalize(r.name))
      );
      const skipped = [];
      let inserted = 0;

      for (const place of migration.places) {
        if (existing.has(normalize(place.name))) {
          skipped.push(place.name);
          continue;
        }
        const { lastInsertRowid } = insertPlace.run({
          name: place.name,
          category: place.category,
          address: place.address,
          description: place.description,
          image_url: place.image_url,
          opening_hours: place.opening_hours,
          price_level: place.price_level,
          highlight: place.highlight,
          latitude: place.latitude,
          longitude: place.longitude,
          instagram: place.instagram ?? null,
        });
        for (const tag of new Set(place.tags)) insertTag.run(lastInsertRowid, tag);
        existing.add(normalize(place.name));
        inserted++;
      }

      markApplied.run(migration.id);
      return { id: migration.id, inserted, skipped };
    });

    results.push(run());
  }

  return results;
}

module.exports = { applyDataMigrations, MIGRATIONS };
