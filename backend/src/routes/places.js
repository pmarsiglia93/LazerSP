const express = require("express");
const router = express.Router();
const {
  getPlaces,
  getPlaceById,
  getCategories,
} = require("../controllers/placesController");

// GET /api/categories  (deve vir antes de /:id para não conflitar)
router.get("/categories", getCategories);

// GET /api/places
router.get("/", getPlaces);

// GET /api/places/:id
router.get("/:id", getPlaceById);

module.exports = router;
