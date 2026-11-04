const { z } = require("zod");
const { getDb } = require("../database/db");
const { publicName } = require("../serializers/user");

const STATUSES = ["published", "hidden"];

function formatAdminReview(row) {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    place: { id: row.place_id, name: row.place_name },
    author: { id: row.user_id, name: publicName(row.user_name), email: row.user_email },
  };
}

// GET /api/admin/reviews?status=published|hidden&limit&offset
function listReviews(req, res, next) {
  try {
    const db = getDb();
    const status = STATUSES.includes(req.query.status) ? req.query.status : null;
    const limitRaw = parseInt(req.query.limit, 10);
    const offsetRaw = parseInt(req.query.offset, 10);
    const limit = limitRaw > 0 && limitRaw <= 100 ? limitRaw : 50;
    const offset = offsetRaw >= 0 ? offsetRaw : 0;

    const where = status ? "WHERE r.status = ?" : "";
    const params = status ? [status] : [];

    const rows = db
      .prepare(`
        SELECT r.*, p.name AS place_name, u.name AS user_name, u.email AS user_email
        FROM reviews r
        JOIN places p ON p.id = r.place_id
        JOIN users u ON u.id = r.user_id
        ${where}
        ORDER BY r.updated_at DESC, r.id DESC
        LIMIT ? OFFSET ?
      `)
      .all(...params, limit, offset);
    const { total } = db.prepare(`SELECT COUNT(*) AS total FROM reviews r ${where}`).get(...params);

    res.json({ success: true, data: rows.map(formatAdminReview), meta: { total, limit, offset } });
  } catch (err) {
    next(err);
  }
}

const statusSchema = z.object({ status: z.enum(STATUSES) });

// PATCH /api/admin/reviews/:id { status }
function updateReviewStatus(req, res, next) {
  try {
    const parsed = statusSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "status deve ser published ou hidden" });
    }
    const result = getDb()
      .prepare("UPDATE reviews SET status = ? WHERE id = ?")
      .run(parsed.data.status, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: "Avaliação não encontrada" });
    }
    res.json({ success: true, data: { id: Number(req.params.id), status: parsed.data.status } });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/reviews/:id
function deleteReview(req, res, next) {
  try {
    const result = getDb().prepare("DELETE FROM reviews WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: "Avaliação não encontrada" });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listReviews, updateReviewStatus, deleteReview };
