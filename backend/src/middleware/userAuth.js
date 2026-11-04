const jwt = require("jsonwebtoken");
const { getDb } = require("../database/db");
const { getGoogleConfig } = require("../config");

const USER_TOKEN_TTL = "30d";

/** Emite o token de sessão de um usuário do app. */
function signUserToken(user, secret) {
  return jwt.sign({ sub: String(user.id), role: "user" }, secret, {
    algorithm: "HS256",
    expiresIn: USER_TOKEN_TTL,
  });
}

/**
 * Lê e valida o token de usuário do header Authorization.
 * @returns {{ user: object|null, error: string|null, status: number|null }}
 */
function resolveUser(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return { user: null, status: 401, error: "Faça login para continuar" };
  }

  const { jwtSecret } = getGoogleConfig();
  if (!jwtSecret) return { user: null, status: 503, error: "Login não configurado" };

  try {
    const payload = jwt.verify(auth.slice(7), jwtSecret, { algorithms: ["HS256"] });
    if (payload.role !== "user") throw new Error("papel inválido");
    // Conta excluída invalida tokens já emitidos
    const user = getDb().prepare("SELECT * FROM users WHERE id = ?").get(Number(payload.sub));
    if (!user) throw new Error("usuário inexistente");
    return { user, status: null, error: null };
  } catch {
    return { user: null, status: 401, error: "Sessão expirada. Faça login novamente." };
  }
}

/** Exige um usuário logado. */
function authenticateUser(req, res, next) {
  const { user, status, error } = resolveUser(req);
  if (!user) return res.status(status).json({ success: false, error });
  req.user = user;
  next();
}

/** Identifica o usuário quando houver token válido, sem exigir login. */
function optionalUser(req, res, next) {
  if (req.headers.authorization) {
    const { user } = resolveUser(req);
    if (user) req.user = user;
  }
  next();
}

module.exports = { signUserToken, authenticateUser, optionalUser, USER_TOKEN_TTL };
