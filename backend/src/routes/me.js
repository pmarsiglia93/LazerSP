/**
 * Rotas do usuário logado: perfil, exclusão de conta e sincronização de
 * favoritos e visitas entre aparelhos.
 */
const express = require("express");
const { z } = require("zod");
const { getDb } = require("../database/db");
const { authenticateUser } = require("../middleware/userAuth");
const { validateId } = require("../middleware/validateId");
const { formatMe } = require("../serializers/user");
const { formatPlaces } = require("../serializers/place");

const router = express.Router();
router.use(authenticateUser);
router.param("placeId", validateId);

const MAX_ITEMS = 1000;

function badRequest(res, message) {
  return res.status(400).json({ success: false, error: message });
}

/** IDs de lugares que existem no banco. */
function existingPlaceIds(db, ids) {
  if (ids.length === 0) return new Set();
  const placeholders = ids.map(() => "?").join(", ");
  return new Set(
    db.prepare(`SELECT id FROM places WHERE id IN (${placeholders})`).all(...ids).map((r) => r.id)
  );
}

function listFavorites(db, userId) {
  const rows = db
    .prepare(`
      SELECT p.* FROM user_favorites f
      JOIN places p ON p.id = f.place_id
      WHERE f.user_id = ?
      ORDER BY f.created_at, p.id
    `)
    .all(userId);
  return formatPlaces(db, rows);
}

function formatVisit(row) {
  return {
    placeId: row.place_id,
    rating: row.rating,
    note: row.note,
    visitedAt: row.visited_at,
    updatedAt: row.updated_at,
  };
}

function listVisits(db, userId) {
  return db
    .prepare("SELECT * FROM user_visits WHERE user_id = ? ORDER BY visited_at")
    .all(userId)
    .map(formatVisit);
}

// ─── Perfil ────────────────────────────────────────────────────────────────

// GET /api/me
router.get("/", (req, res) => {
  res.json({ success: true, data: formatMe(req.user) });
});

// DELETE /api/me — exclui a conta e todos os dados ligados a ela
router.delete("/", (req, res, next) => {
  try {
    // Favoritos, visitas e avaliações saem pelo ON DELETE CASCADE
    getDb().prepare("DELETE FROM users WHERE id = ?").run(req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── Favoritos ─────────────────────────────────────────────────────────────

const placeIdsSchema = z.object({
  placeIds: z.array(z.number().int().positive()).max(MAX_ITEMS),
});

// GET /api/me/favorites
router.get("/favorites", (req, res, next) => {
  try {
    res.json({ success: true, data: listFavorites(getDb(), req.user.id) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/me/favorites — substitui a lista inteira (usado na sincronização)
router.put("/favorites", (req, res, next) => {
  try {
    const parsed = placeIdsSchema.safeParse(req.body);
    if (!parsed.success) return badRequest(res, "placeIds deve ser uma lista de IDs");

    const db = getDb();
    const ids = [...new Set(parsed.data.placeIds)];
    const valid = existingPlaceIds(db, ids);

    db.transaction(() => {
      db.prepare("DELETE FROM user_favorites WHERE user_id = ?").run(req.user.id);
      const insert = db.prepare("INSERT INTO user_favorites (user_id, place_id) VALUES (?, ?)");
      // IDs de lugares removidos do catálogo são descartados em silêncio
      for (const id of ids) if (valid.has(id)) insert.run(req.user.id, id);
    })();

    res.json({ success: true, data: listFavorites(db, req.user.id) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/me/favorites/:placeId
router.put("/favorites/:placeId", (req, res, next) => {
  try {
    const db = getDb();
    const placeId = Number(req.params.placeId);
    if (!existingPlaceIds(db, [placeId]).has(placeId)) {
      return res.status(404).json({ success: false, error: "Lugar não encontrado" });
    }
    db.prepare("INSERT OR IGNORE INTO user_favorites (user_id, place_id) VALUES (?, ?)").run(req.user.id, placeId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// DELETE /api/me/favorites/:placeId
router.delete("/favorites/:placeId", (req, res, next) => {
  try {
    getDb()
      .prepare("DELETE FROM user_favorites WHERE user_id = ? AND place_id = ?")
      .run(req.user.id, Number(req.params.placeId));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── Visitas ───────────────────────────────────────────────────────────────

const isoDate = z.string().max(40).refine((v) => !Number.isNaN(Date.parse(v)), "data inválida");

const visitBody = z.object({
  rating: z.number().int().min(1).max(5).nullable().optional().default(null),
  note: z.string().max(280).optional().default(""),
  visitedAt: isoDate.optional(),
  updatedAt: isoDate.optional(),
});

const visitsSchema = z.object({
  visits: z.array(visitBody.extend({ placeId: z.number().int().positive() })).max(MAX_ITEMS),
});

function upsertVisit(db, userId, visit) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO user_visits (user_id, place_id, rating, note, visited_at, updated_at)
    VALUES (@userId, @placeId, @rating, @note, @visitedAt, @updatedAt)
    ON CONFLICT (user_id, place_id) DO UPDATE SET
      rating = excluded.rating,
      note = excluded.note,
      updated_at = excluded.updated_at
  `).run({
    userId,
    placeId: visit.placeId,
    rating: visit.rating,
    note: visit.note,
    visitedAt: visit.visitedAt || now,
    updatedAt: visit.updatedAt || now,
  });
}

// GET /api/me/visits
router.get("/visits", (req, res, next) => {
  try {
    res.json({ success: true, data: listVisits(getDb(), req.user.id) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/me/visits — substitui a lista inteira (usado na sincronização)
router.put("/visits", (req, res, next) => {
  try {
    const parsed = visitsSchema.safeParse(req.body);
    if (!parsed.success) return badRequest(res, "visits inválido");

    const db = getDb();
    const visits = parsed.data.visits;
    const valid = existingPlaceIds(db, [...new Set(visits.map((v) => v.placeId))]);

    db.transaction(() => {
      db.prepare("DELETE FROM user_visits WHERE user_id = ?").run(req.user.id);
      for (const visit of visits) if (valid.has(visit.placeId)) upsertVisit(db, req.user.id, visit);
    })();

    res.json({ success: true, data: listVisits(db, req.user.id) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/me/visits/:placeId
router.put("/visits/:placeId", (req, res, next) => {
  try {
    const parsed = visitBody.safeParse(req.body ?? {});
    if (!parsed.success) return badRequest(res, "Visita inválida");

    const db = getDb();
    const placeId = Number(req.params.placeId);
    if (!existingPlaceIds(db, [placeId]).has(placeId)) {
      return res.status(404).json({ success: false, error: "Lugar não encontrado" });
    }
    upsertVisit(db, req.user.id, { ...parsed.data, placeId });
    const row = db.prepare("SELECT * FROM user_visits WHERE user_id = ? AND place_id = ?").get(req.user.id, placeId);
    res.json({ success: true, data: formatVisit(row) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/me/visits/:placeId
router.delete("/visits/:placeId", (req, res, next) => {
  try {
    getDb()
      .prepare("DELETE FROM user_visits WHERE user_id = ? AND place_id = ?")
      .run(req.user.id, Number(req.params.placeId));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
