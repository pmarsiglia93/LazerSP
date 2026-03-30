const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "username e password são obrigatórios" });
  }
  if (username !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: "Credenciais inválidas" });
  }
  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "24h" });
  res.json({ success: true, token });
});

module.exports = router;
