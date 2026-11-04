const { getDb } = require("../database/db");
const { findPlace } = require("../serializers/place");
const { parsePlace } = require("../validation/place");

function notFoundError() {
  const error = new Error("Lugar não encontrado");
  error.status = 404;
  return error;
}

function validationError(res, errors) {
  return res.status(400).json({ success: false, error: errors[0], errors });
}

function toRow(data) {
  return [
    data.name,
    data.category,
    data.address,
    data.description,
    data.imageUrl,
    data.rating,
    data.openingHours,
    data.priceLevel,
    data.highlight,
    data.isOpen ? 1 : 0,
    data.latitude,
    data.longitude,
    data.instagram,
  ];
}

function replaceTags(db, placeId, tags) {
  db.prepare("DELETE FROM tags WHERE place_id = ?").run(placeId);
  const insert = db.prepare("INSERT INTO tags (place_id, name) VALUES (?, ?)");
  for (const tag of new Set(tags)) insert.run(placeId, tag);
}

// POST /api/admin/places
function createPlace(req, res, next) {
  try {
    const parsed = parsePlace(req.body);
    if (!parsed.ok) return validationError(res, parsed.errors);
    const data = parsed.data;

    const db = getDb();
    // Lugar e tags são gravados juntos: se as tags falharem, nada é salvo.
    const create = db.transaction(() => {
      const { lastInsertRowid } = db
        .prepare(`
          INSERT INTO places (name, category, address, description, image_url, rating, opening_hours, price_level, highlight, is_open, latitude, longitude, instagram)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(...toRow(data));
      replaceTags(db, lastInsertRowid, data.tags);
      return lastInsertRowid;
    });

    const newId = create();
    res.status(201).json({ success: true, data: findPlace(db, newId) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/places/:id
function updatePlace(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;

    if (!db.prepare("SELECT id FROM places WHERE id = ?").get(id)) return next(notFoundError());

    const parsed = parsePlace(req.body);
    if (!parsed.ok) return validationError(res, parsed.errors);
    const data = parsed.data;

    db.transaction(() => {
      db.prepare(`
        UPDATE places SET
          name = ?, category = ?, address = ?, description = ?, image_url = ?,
          rating = ?, opening_hours = ?, price_level = ?, highlight = ?,
          is_open = ?, latitude = ?, longitude = ?, instagram = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(...toRow(data), id);
      replaceTags(db, id, data.tags);
    })();

    res.json({ success: true, data: findPlace(db, id) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/places/:id
function deletePlace(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare("SELECT id, name FROM places WHERE id = ?").get(id);
    if (!existing) return next(notFoundError());

    // As tags são removidas pelo ON DELETE CASCADE
    db.prepare("DELETE FROM places WHERE id = ?").run(id);

    res.json({ success: true, message: `"${existing.name}" removido com sucesso` });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPlace, updatePlace, deletePlace };
