const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { createPlace, updatePlace, deletePlace } = require("../controllers/adminController");

router.use(authenticate);

router.post("/places", createPlace);
router.put("/places/:id", updatePlace);
router.delete("/places/:id", deletePlace);

module.exports = router;
