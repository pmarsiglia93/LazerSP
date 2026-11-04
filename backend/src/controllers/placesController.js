const { getDb } = require("../database/db");
const { formatPlaces, findPlace } = require("../serializers/place");

const MAX_SEARCH_LENGTH = 100;

/** Escapa os curingas do LIKE para que "%" e "_" sejam buscados literalmente. */
function likeTerm(value) {
  return `%${value.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

// GET /api/places
function getPlaces(req, res, next) {
  try {
    const db = getDb();
    const { category, free } = req.query;
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, MAX_SEARCH_LENGTH) : "";

    const limitRaw = parseInt(req.query.limit, 10);
    const offsetRaw = parseInt(req.query.offset, 10);
    const limit = limitRaw > 0 && limitRaw <= 200 ? limitRaw : 50;
    const offset = offsetRaw >= 0 ? offsetRaw : 0;

    let conditions = "WHERE 1=1";
    const filterParams = [];

    if (typeof category === "string" && category && category !== "Todos") {
      conditions += " AND category = ?";
      filterParams.push(category);
    }

    if (search) {
      conditions += ` AND (
        name LIKE ? ESCAPE '\\' OR
        category LIKE ? ESCAPE '\\' OR
        address LIKE ? ESCAPE '\\' OR
        description LIKE ? ESCAPE '\\' OR
        highlight LIKE ? ESCAPE '\\' OR
        id IN (SELECT place_id FROM tags WHERE name LIKE ? ESCAPE '\\')
      )`;
      const term = likeTerm(search);
      filterParams.push(term, term, term, term, term, term);
    }

    if (free === "true") {
      conditions += " AND price_level = 'Gratuito'";
    }

    const rows = db
      .prepare(`SELECT * FROM places ${conditions} ORDER BY rating DESC, id ASC LIMIT ? OFFSET ?`)
      .all(...filterParams, limit, offset);

    const data = formatPlaces(db, rows);

    const { total } = db
      .prepare(`SELECT COUNT(*) as total FROM places ${conditions}`)
      .get(...filterParams);

    res.json({ success: true, data, meta: { total, limit, offset } });
  } catch (err) {
    next(err);
  }
}

// GET /api/places/:id
function getPlaceById(req, res, next) {
  try {
    const place = findPlace(getDb(), req.params.id);
    if (!place) {
      const error = new Error("Lugar não encontrado");
      error.status = 404;
      return next(error);
    }
    res.json({ success: true, data: place });
  } catch (err) {
    next(err);
  }
}

// GET /api/places/categories
function getCategories(req, res, next) {
  try {
    const rows = getDb()
      .prepare("SELECT DISTINCT category FROM places ORDER BY category ASC")
      .all();
    res.json({ success: true, data: ["Todos", ...rows.map((r) => r.category)] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPlaces, getPlaceById, getCategories };
