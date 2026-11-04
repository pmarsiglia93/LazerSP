/**
 * Leitura e validação das variáveis de ambiente.
 *
 * As configurações do painel administrativo são lidas a cada chamada (e não
 * congeladas no carregamento do módulo) para que os testes possam variar o
 * ambiente sem recarregar o app.
 */

const MIN_JWT_SECRET_LENGTH = 32;

const read = (name) => (process.env[name] || "").trim();

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getAllowedOrigins() {
  return read("ALLOWED_ORIGINS")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Configuração do login do painel.
 * A senha pode vir como hash bcrypt (ADMIN_PASSWORD_HASH, recomendado) ou em
 * texto puro (ADMIN_PASSWORD, mantido por compatibilidade).
 */
function getAdminConfig() {
  const user = read("ADMIN_USER");
  const passwordHash = read("ADMIN_PASSWORD_HASH");
  const password = read("ADMIN_PASSWORD");
  const jwtSecret = read("JWT_SECRET");

  const problems = [];
  if (!user) problems.push("ADMIN_USER não definido");
  if (!passwordHash && !password) problems.push("ADMIN_PASSWORD_HASH (ou ADMIN_PASSWORD) não definido");
  if (passwordHash && !/^\$2[aby]\$\d{2}\$.{53}$/.test(passwordHash)) {
    problems.push("ADMIN_PASSWORD_HASH não é um hash bcrypt válido");
  }
  if (!jwtSecret) problems.push("JWT_SECRET não definido");

  return {
    user,
    passwordHash,
    password,
    jwtSecret,
    enabled: problems.length === 0,
    problems,
  };
}

/**
 * Login de usuários do app com Google. GOOGLE_CLIENT_IDS lista os client IDs
 * OAuth aceitos como audiência do ID token (web, Android e iOS), separados por vírgula.
 */
function getGoogleConfig() {
  const clientIds = read("GOOGLE_CLIENT_IDS")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const jwtSecret = read("JWT_SECRET");
  return { clientIds, jwtSecret, enabled: clientIds.length > 0 && Boolean(jwtSecret) };
}

/**
 * Verifica a configuração na subida do servidor e devolve os avisos.
 * Não derruba o processo: um painel mal configurado não deve tirar do ar a
 * API pública consumida pelo app. O login responde 503 nesse caso.
 * @returns {string[]} avisos para registrar no log
 */
function checkConfig() {
  const warnings = [];
  const admin = getAdminConfig();

  if (!admin.enabled) {
    warnings.push(`Painel administrativo desativado: ${admin.problems.join("; ")}.`);
  } else {
    if (!admin.passwordHash) {
      warnings.push(
        "ADMIN_PASSWORD em texto puro está obsoleto. Gere um hash com `npm run hash-password` e use ADMIN_PASSWORD_HASH."
      );
    }
    if (admin.jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
      warnings.push(`JWT_SECRET tem menos de ${MIN_JWT_SECRET_LENGTH} caracteres; use um valor aleatório mais longo.`);
    }
  }

  if (!getGoogleConfig().enabled) {
    warnings.push("Login com Google desativado: defina GOOGLE_CLIENT_IDS e JWT_SECRET.");
  }

  if (isProduction() && getAllowedOrigins().length === 0) {
    warnings.push("ALLOWED_ORIGINS vazio em produção: navegadores (versão web e painel em outra origem) serão bloqueados pelo CORS.");
  }

  return warnings;
}

module.exports = {
  isProduction,
  getAllowedOrigins,
  getAdminConfig,
  getGoogleConfig,
  checkConfig,
  MIN_JWT_SECRET_LENGTH,
};
