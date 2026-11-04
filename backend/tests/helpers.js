const fs = require("fs");
const os = require("os");
const path = require("path");

const ADMIN_ENV = ["ADMIN_USER", "ADMIN_PASSWORD", "ADMIN_PASSWORD_HASH", "JWT_SECRET", "ALLOWED_ORIGINS", "GOOGLE_CLIENT_IDS"];

/**
 * Prepara um banco SQLite temporário e exclusivo para o arquivo de teste.
 * Deve ser chamado ANTES de qualquer require do app.
 * @param {{ seeded?: boolean }} [options] popula com os 45 lugares do seed
 */
function setupTestDb({ seeded = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lazersp-test-"));
  process.env.DB_PATH = path.join(dir, "test.db");
  process.env.NODE_ENV = "test";

  // Isola os testes de um eventual backend/.env local
  for (const name of ADMIN_ENV) delete process.env[name];

  if (seeded) require("../src/database/seed").seed({ silent: true });

  afterAll(() => {
    require("../src/database/db").getDb().close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
}

const TEST_SECRET = "segredo-de-teste-com-mais-de-32-caracteres";

/** Configura o login do painel com senha em texto puro. */
function configureAdmin(overrides = {}) {
  Object.assign(process.env, {
    ADMIN_USER: "admin",
    ADMIN_PASSWORD: "senha-forte",
    JWT_SECRET: TEST_SECRET,
    ...overrides,
  });
}

/** Configura o login com Google (o verificador do token é simulado nos testes). */
function configureGoogle(overrides = {}) {
  Object.assign(process.env, {
    GOOGLE_CLIENT_IDS: "web-client.apps.googleusercontent.com",
    JWT_SECRET: TEST_SECRET,
    ...overrides,
  });
}

/** Cria um usuário direto no banco e devolve o token de sessão dele. */
function createUser({ sub = "google-sub-1", email = "maria@example.com", name = "Maria da Silva" } = {}) {
  const { getDb } = require("../src/database/db");
  const { signUserToken } = require("../src/middleware/userAuth");
  const db = getDb();
  db.prepare("INSERT INTO users (google_sub, email, name) VALUES (?, ?, ?)").run(sub, email, name);
  const user = db.prepare("SELECT * FROM users WHERE google_sub = ?").get(sub);
  return { user, token: signUserToken(user, TEST_SECRET), auth: { Authorization: `Bearer ${signUserToken(user, TEST_SECRET)}` } };
}

module.exports = { setupTestDb, configureAdmin, configureGoogle, createUser, TEST_SECRET };
