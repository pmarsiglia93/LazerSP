const jwt = require("jsonwebtoken");
const { getAdminConfig } = require("../config");

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Token de autenticação necessário" });
  }

  const { jwtSecret } = getAdminConfig();
  if (!jwtSecret) {
    return res.status(503).json({ success: false, error: "Painel administrativo não configurado" });
  }

  try {
    const payload = jwt.verify(auth.slice(7), jwtSecret, { algorithms: ["HS256"] });
    // Tokens emitidos antes da inclusão do papel não têm `role`: 401 faz o
    // painel pedir um novo login em vez de mostrar erro.
    if (payload.role !== "admin") {
      return res.status(401).json({ success: false, error: "Token inválido ou expirado" });
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Token inválido ou expirado" });
  }
}

module.exports = { authenticate };
