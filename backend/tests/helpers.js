const fs = require("fs");
const os = require("os");
const path = require("path");

const ADMIN_ENV = ["ADMIN_USER", "ADMIN_PASSWORD", "ADMIN_PASSWORD_HASH", "JWT_SECRET", "ALLOWED_ORIGINS"];

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

module.exports = { setupTestDb, configureAdmin, TEST_SECRET };
