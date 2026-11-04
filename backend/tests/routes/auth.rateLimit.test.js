// Arquivo separado: o contador do rate limit é compartilhado por toda a
// instância do app, então este teste não pode dividir o app com outros.
const { setupTestDb, configureAdmin } = require("../helpers");
setupTestDb();

const request = require("supertest");
const app = require("../../src/app");

const login = (password) =>
  request(app).post("/api/auth/login").send({ username: "admin", password });

describe("rate limit do login", () => {
  beforeAll(() => configureAdmin());

  it("bloqueia com 429 depois de 10 tentativas erradas", async () => {
    for (let i = 0; i < 10; i++) {
      expect((await login(`errada-${i}`)).statusCode).toBe(401);
    }
    const blocked = await login("errada-final");
    expect(blocked.statusCode).toBe(429);
    expect(blocked.body.error).toMatch(/Muitas tentativas/);
  });

  it("continua bloqueando mesmo com a senha certa durante a janela", async () => {
    expect((await login("senha-forte")).statusCode).toBe(429);
  });
});

describe("rate limit do login com acertos", () => {
  it("logins bem-sucedidos não consomem o limite", async () => {
    // Novo app isolado, com contador zerado
    let freshApp;
    jest.isolateModules(() => {
      freshApp = require("../../src/app");
    });
    for (let i = 0; i < 12; i++) {
      const res = await request(freshApp)
        .post("/api/auth/login")
        .send({ username: "admin", password: "senha-forte" });
      expect(res.statusCode).toBe(200);
    }
  });
});
