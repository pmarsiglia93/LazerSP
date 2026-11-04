const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { validateId } = require("../middleware/validateId");
const { createPlace, updatePlace, deletePlace } = require("../controllers/adminController");

router.use(authenticate);
router.param("id", validateId);

router.post("/places", createPlace);
router.put("/places/:id", updatePlace);
router.delete("/places/:id", deletePlace);

module.exports = router;
