const { setupTestDb, configureAdmin, TEST_SECRET } = require("../helpers");
setupTestDb();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../../src/app");

const login = (body) => request(app).post("/api/auth/login").send(body);

describe("POST /api/auth/login", () => {
  afterEach(() => {
    for (const name of ["ADMIN_USER", "ADMIN_PASSWORD", "ADMIN_PASSWORD_HASH", "JWT_SECRET"]) {
      delete process.env[name];
    }
  });

  it("responde 503 quando o painel não está configurado (sem vazar erro interno)", async () => {
    configureAdmin({ JWT_SECRET: "" });
    const res = await login({ username: "admin", password: "senha-forte" });
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe("Painel administrativo não configurado");
  });

  it.each([
    [{}],
    [{ username: "admin" }],
    [{ password: "x" }],
    [{ username: "", password: "" }],
    [{ username: 123, password: ["x"] }],
  ])("responde 400 para corpo inválido %j", async (body) => {
    configureAdmin();
    const res = await login(body);
    expect(res.statusCode).toBe(400);
  });

  it("responde 401 para senha errada", async () => {
    configureAdmin();
    const res = await login({ username: "admin", password: "errada" });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Credenciais inválidas");
  });

  it("responde 401 para usuário errado", async () => {
    configureAdmin();
    const res = await login({ username: "outro", password: "senha-forte" });
    expect(res.statusCode).toBe(401);
  });

  it("não remove espaços da senha digitada", async () => {
    configureAdmin();
    const res = await login({ username: "admin", password: " senha-forte " });
    expect(res.statusCode).toBe(401);
  });

  it("aceita senha em texto puro (compatibilidade com ADMIN_PASSWORD)", async () => {
    configureAdmin();
    const res = await login({ username: " admin ", password: "senha-forte" });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("aceita senha com hash bcrypt (ADMIN_PASSWORD_HASH) e ignora ADMIN_PASSWORD", async () => {
    configureAdmin({
      ADMIN_PASSWORD: "senha-antiga",
      ADMIN_PASSWORD_HASH: await bcrypt.hash("senha-nova", 4),
    });
    expect((await login({ username: "admin", password: "senha-nova" })).statusCode).toBe(200);
    expect((await login({ username: "admin", password: "senha-antiga" })).statusCode).toBe(401);
  });

  it("emite um JWT HS256 com papel de admin, válido por 24h", async () => {
    configureAdmin();
    const res = await login({ username: "admin", password: "senha-forte" });
    const decoded = jwt.verify(res.body.token, TEST_SECRET, { algorithms: ["HS256"] });
    expect(decoded.sub).toBe("admin");
    expect(decoded.role).toBe("admin");
    expect(decoded.exp - decoded.iat).toBe(24 * 60 * 60);
  });

  it("responde 400 com mensagem clara para JSON malformado", async () => {
    configureAdmin();
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{malformado");
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("JSON inválido no corpo da requisição");
  });
});
