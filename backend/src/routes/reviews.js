/**
 * Avaliações públicas de um lugar: /api/places/:id/reviews
 * Leitura aberta; criar, editar e remover a própria avaliação exige login.
 */
const express = require("express");
const rateLimit = require("express-rate-limit").default;
const { z } = require("zod");
const { getDb } = require("../database/db");
const { authenticateUser, optionalUser } = require("../middleware/userAuth");
const { publicName } = require("../serializers/user");

const router = express.Router({ mergeParams: true });

// Limita escrita por usuário: evita spam sem afetar quem só está lendo
const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => `user:${req.user.id}`,
  message: { success: false, error: "Muitas avaliações em pouco tempo. Tente novamente mais tarde." },
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().default(""),
});

function formatReview(row) {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: { name: publicName(row.user_name), avatarUrl: row.avatar_url || null },
  };
}

function placeExists(db, id) {
  return Boolean(db.prepare("SELECT 1 FROM places WHERE id = ?").get(id));
}

function notFound(res) {
  return res.status(404).json({ success: false, error: "Lugar não encontrado" });
}

const SELECT_REVIEW = `
  SELECT r.*, u.name AS user_name, u.avatar_url
  FROM reviews r JOIN users u ON u.id = r.user_id
`;

// GET /api/places/:id/reviews
router.get("/", optionalUser, (req, res, next) => {
  try {
    const db = getDb();
    const placeId = Number(req.params.id);
    if (!placeExists(db, placeId)) return notFound(res);

    const limitRaw = parseInt(req.query.limit, 10);
    const offsetRaw = parseInt(req.query.offset, 10);
    const limit = limitRaw > 0 && limitRaw <= 50 ? limitRaw : 20;
    const offset = offsetRaw >= 0 ? offsetRaw : 0;

    const rows = db
      .prepare(`${SELECT_REVIEW} WHERE r.place_id = ? AND r.status = 'published' ORDER BY r.updated_at DESC, r.id DESC LIMIT ? OFFSET ?`)
      .all(placeId, limit, offset);

    const summary = db
      .prepare("SELECT COUNT(*) AS count, AVG(rating) AS average FROM reviews WHERE place_id = ? AND status = 'published'")
      .get(placeId);

    // A própria avaliação aparece para o autor mesmo se estiver oculta
    let mine = null;
    if (req.user) {
      const own = db.prepare(`${SELECT_REVIEW} WHERE r.place_id = ? AND r.user_id = ?`).get(placeId, req.user.id);
      if (own) mine = { ...formatReview(own), status: own.status };
    }

    res.json({
      success: true,
      data: rows.map(formatReview),
      mine,
      meta: {
        total: summary.count,
        average: summary.count ? Math.round(summary.average * 10) / 10 : null,
        limit,
        offset,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/places/:id/reviews — cria ou edita a própria avaliação
router.put("/", authenticateUser, writeLimiter, (req, res, next) => {
  try {
    const db = getDb();
    const placeId = Number(req.params.id);
    if (!placeExists(db, placeId)) return notFound(res);

    const parsed = reviewSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Escolha de 1 a 5 estrelas; comentário com até 500 caracteres" });
    }

    // Editar não reabre uma avaliação ocultada pela moderação
    db.prepare(`
      INSERT INTO reviews (place_id, user_id, rating, comment)
      VALUES (@placeId, @userId, @rating, @comment)
      ON CONFLICT (user_id, place_id) DO UPDATE SET
        rating = excluded.rating,
        comment = excluded.comment,
        updated_at = datetime('now')
    `).run({ placeId, userId: req.user.id, ...parsed.data });

    const own = db.prepare(`${SELECT_REVIEW} WHERE r.place_id = ? AND r.user_id = ?`).get(placeId, req.user.id);
    res.json({ success: true, data: { ...formatReview(own), status: own.status } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/places/:id/reviews — remove a própria avaliação
router.delete("/", authenticateUser, (req, res, next) => {
  try {
    getDb()
      .prepare("DELETE FROM reviews WHERE place_id = ? AND user_id = ?")
      .run(Number(req.params.id), req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
