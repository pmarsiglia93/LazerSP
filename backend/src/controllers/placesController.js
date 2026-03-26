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

// GET /api/places
function getPlaces(req, res, next) {
  try {
    const db = getDb();
    const { category, search, free } = req.query;

    const limitRaw = parseInt(req.query.limit, 10);
    const offsetRaw = parseInt(req.query.offset, 10);
    const limit = limitRaw > 0 && limitRaw <= 200 ? limitRaw : 50;
    const offset = offsetRaw >= 0 ? offsetRaw : 0;

    let conditions = "WHERE 1=1";
    const filterParams = [];

    if (category && category !== "Todos") {
      conditions += " AND category = ?";
      filterParams.push(category);
    }

    if (search) {
      conditions += ` AND (
        name LIKE ? OR
        category LIKE ? OR
        address LIKE ? OR
        description LIKE ? OR
        highlight LIKE ? OR
        id IN (SELECT place_id FROM tags WHERE name LIKE ?)
      )`;
      const term = `%${search}%`;
      filterParams.push(term, term, term, term, term, term);
    }

    if (free === "true") {
      conditions += " AND price_level = 'Gratuito'";
    }

    const places = db
      .prepare(`SELECT * FROM places ${conditions} ORDER BY rating DESC LIMIT ? OFFSET ?`)
      .all(...filterParams, limit, offset);

    const tagsStmt = db.prepare("SELECT name FROM tags WHERE place_id = ?");
    const result = places.map((place) => {
      const tags = tagsStmt.all(place.id).map((t) => t.name);
      return formatPlace(place, tags);
    });

    const { total } = db
      .prepare(`SELECT COUNT(*) as total FROM places ${conditions}`)
      .get(...filterParams);

    res.json({
      success: true,
      data: result,
      meta: {
        total,
        limit,
        offset,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/places/:id
function getPlaceById(req, res, next) {
  try {
    const db = getDb();
    const { id } = req.params;

    const place = db.prepare("SELECT * FROM places WHERE id = ?").get(id);

    if (!place) {
      const error = new Error("Lugar não encontrado");
      error.status = 404;
      return next(error);
    }

    const tags = db
      .prepare("SELECT name FROM tags WHERE place_id = ?")
      .all(id)
      .map((t) => t.name);

    res.json({
      success: true,
      data: formatPlace(place, tags),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/categories
function getCategories(req, res, next) {
  try {
    const db = getDb();
    const rows = db
      .prepare("SELECT DISTINCT category FROM places ORDER BY category ASC")
      .all();

    const categories = ["Todos", ...rows.map((r) => r.category)];

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPlaces, getPlaceById, getCategories };
