const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit").default;
const { z } = require("zod");
const { getAdminConfig } = require("../config");

const router = express.Router();

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;

// Limita tentativas com credenciais erradas (401) por IP. Logins
// bem-sucedidos e requisições malformadas não contam.
const loginLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: LOGIN_MAX_FAILURES,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (req, res) => res.statusCode !== 401,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
});

const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

/** Comparação em tempo constante, independente do tamanho das strings. */
function safeEqual(a, b) {
  const digest = (value) => crypto.createHash("sha256").update(String(value)).digest();
  return crypto.timingSafeEqual(digest(a), digest(b));
}

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const admin = getAdminConfig();
    if (!admin.enabled) {
      return res.status(503).json({ success: false, error: "Painel administrativo não configurado" });
    }

    const parsed = loginSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "username e password são obrigatórios" });
    }
    const { username, password } = parsed.data;

    // As duas verificações sempre rodam, para não revelar pelo tempo de
    // resposta se o usuário existe.
    const userOk = safeEqual(username, admin.user);
    const passwordOk = admin.passwordHash
      ? await bcrypt.compare(password, admin.passwordHash)
      : safeEqual(password, admin.password);

    if (!userOk || !passwordOk) {
      return res.status(401).json({ success: false, error: "Credenciais inválidas" });
    }

    const token = jwt.sign({ sub: admin.user, role: "admin" }, admin.jwtSecret, {
      algorithm: "HS256",
      expiresIn: "24h",
    });
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
