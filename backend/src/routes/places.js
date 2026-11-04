const express = require("express");
const router = express.Router();
const {
  getPlaces,
  getPlaceById,
  getCategories,
} = require("../controllers/placesController");
const { validateId } = require("../middleware/validateId");
const reviewsRouter = require("./reviews");

router.param("id", validateId);

// GET /api/places/categories  (deve vir antes de /:id para não conflitar)
router.get("/categories", getCategories);

// GET /api/places
router.get("/", getPlaces);

// /api/places/:id/reviews
router.use("/:id/reviews", reviewsRouter);

// GET /api/places/:id
router.get("/:id", getPlaceById);

module.exports = router;
