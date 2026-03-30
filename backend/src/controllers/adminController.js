const { getDb } = require("../database/db");
const { isOpenNow } = require("../utils/openingHours");

function formatPlace(row, tags) {
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
    tags: tags || [],
    createdAt: row.created_at,
  };
}

// POST /api/admin/places
function createPlace(req, res, next) {
  try {
    const db = getDb();
    const {
      name, category, address, description, imageUrl,
      rating, openingHours, priceLevel, highlight,
      isOpen, latitude, longitude, instagram, tags,
    } = req.body;

    if (!name || !category || !address) {
      return res.status(400).json({ success: false, error: "name, category e address são obrigatórios" });
    }

    const result = db.prepare(`
      INSERT INTO places (name, category, address, description, image_url, rating, opening_hours, price_level, highlight, is_open, latitude, longitude, instagram)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      category,
      address,
      description || "",
      imageUrl || "",
      parseFloat(rating) || 0,
      openingHours || "",
      priceLevel || "Gratuito",
      highlight || "",
      isOpen ? 1 : 0,
      parseFloat(latitude) || 0,
      parseFloat(longitude) || 0,
      instagram || null,
    );

    const newId = result.lastInsertRowid;

    if (Array.isArray(tags) && tags.length > 0) {
      const tagStmt = db.prepare("INSERT INTO tags (place_id, name) VALUES (?, ?)");
      for (const tag of tags) {
        if (tag.trim()) tagStmt.run(newId, tag.trim());
      }
    }

    const place = db.prepare("SELECT * FROM places WHERE id = ?").get(newId);
    const placeTags = db.prepare("SELECT name FROM tags WHERE place_id = ?").all(newId).map((t) => t.name);

    res.status(201).json({ success: true, data: formatPlace(place, placeTags) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/places/:id
function updatePlace(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare("SELECT id FROM places WHERE id = ?").get(id);
    if (!existing) {
      const error = new Error("Lugar não encontrado");
      error.status = 404;
      return next(error);
    }

    const {
      name, category, address, description, imageUrl,
      rating, openingHours, priceLevel, highlight,
      isOpen, latitude, longitude, instagram, tags,
    } = req.body;

    if (!name || !category || !address) {
      return res.status(400).json({ success: false, error: "name, category e address são obrigatórios" });
    }

    db.prepare(`
      UPDATE places SET
        name = ?, category = ?, address = ?, description = ?, image_url = ?,
        rating = ?, opening_hours = ?, price_level = ?, highlight = ?,
        is_open = ?, latitude = ?, longitude = ?, instagram = ?
      WHERE id = ?
    `).run(
      name,
      category,
      address,
      description || "",
      imageUrl || "",
      parseFloat(rating) || 0,
      openingHours || "",
      priceLevel || "Gratuito",
      highlight || "",
      isOpen ? 1 : 0,
      parseFloat(latitude) || 0,
      parseFloat(longitude) || 0,
      instagram || null,
      id,
    );

    // Tags: delete all and re-insert (CASCADE handles this but we delete explicitly)
    db.prepare("DELETE FROM tags WHERE place_id = ?").run(id);
    if (Array.isArray(tags) && tags.length > 0) {
      const tagStmt = db.prepare("INSERT INTO tags (place_id, name) VALUES (?, ?)");
      for (const tag of tags) {
        if (tag.trim()) tagStmt.run(id, tag.trim());
      }
    }

    const place = db.prepare("SELECT * FROM places WHERE id = ?").get(id);
    const placeTags = db.prepare("SELECT name FROM tags WHERE place_id = ?").all(id).map((t) => t.name);

    res.json({ success: true, data: formatPlace(place, placeTags) });
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
    if (!existing) {
      const error = new Error("Lugar não encontrado");
      error.status = 404;
      return next(error);
    }

    // Tags are deleted automatically via ON DELETE CASCADE
    db.prepare("DELETE FROM places WHERE id = ?").run(id);

    res.json({ success: true, message: `"${existing.name}" removido com sucesso` });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPlace, updatePlace, deletePlace };
