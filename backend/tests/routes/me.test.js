const { setupTestDb, configureGoogle, configureAdmin, createUser, TEST_SECRET } = require("../helpers");
setupTestDb({ seeded: true });
configureGoogle();
configureAdmin();

const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../../src/app");
const { getDb } = require("../../src/database/db");

const placeIds = getDb().prepare("SELECT id FROM places ORDER BY id LIMIT 5").all().map((r) => r.id);
const [P1, P2, P3] = placeIds;

describe("autenticação de /api/me", () => {
  it("responde 401 sem token", async () => {
    expect((await request(app).get("/api/me")).statusCode).toBe(401);
  });

  it("responde 401 com token de admin", async () => {
    const adminToken = jwt.sign({ sub: "admin", role: "admin" }, TEST_SECRET);
    const res = await request(app).get("/api/me").set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(401);
  });

  it("responde 401 com token de usuário que não existe mais", async () => {
    const ghost = jwt.sign({ sub: "999999", role: "user" }, TEST_SECRET);
    const res = await request(app).get("/api/me").set("Authorization", `Bearer ${ghost}`);
    expect(res.statusCode).toBe(401);
  });

  it("devolve o perfil do usuário", async () => {
    const { auth } = createUser({ sub: "perfil", email: "perfil@example.com", name: "Ana Lima" });
    const res = await request(app).get("/api/me").set(auth);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toMatchObject({ email: "perfil@example.com", name: "Ana Lima" });
  });
});

describe("favoritos", () => {
  const { auth } = createUser({ sub: "favoritos", email: "fav@example.com" });

  it("começa vazio", async () => {
    const res = await request(app).get("/api/me/favorites").set(auth);
    expect(res.body.data).toEqual([]);
  });

  it("PUT substitui a lista, ignora duplicados e IDs inexistentes e devolve os lugares", async () => {
    const res = await request(app)
      .put("/api/me/favorites")
      .set(auth)
      .send({ placeIds: [P1, P2, P1, 999999] });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.map((p) => p.id)).toEqual([P1, P2]);
    expect(res.body.data[0]).toHaveProperty("tags");
    expect(res.body.data[0]).toHaveProperty("reviews");
  });

  it("PUT com lista vazia remove todos", async () => {
    const res = await request(app).put("/api/me/favorites").set(auth).send({ placeIds: [] });
    expect(res.body.data).toEqual([]);
  });

  it("PUT /favorites/:id adiciona um e é idempotente", async () => {
    expect((await request(app).put(`/api/me/favorites/${P3}`).set(auth)).statusCode).toBe(204);
    expect((await request(app).put(`/api/me/favorites/${P3}`).set(auth)).statusCode).toBe(204);
    const res = await request(app).get("/api/me/favorites").set(auth);
    expect(res.body.data.map((p) => p.id)).toEqual([P3]);
  });

  it("PUT /favorites/:id responde 404 para lugar inexistente", async () => {
    expect((await request(app).put("/api/me/favorites/999999").set(auth)).statusCode).toBe(404);
  });

  it("DELETE /favorites/:id remove", async () => {
    expect((await request(app).delete(`/api/me/favorites/${P3}`).set(auth)).statusCode).toBe(204);
    const res = await request(app).get("/api/me/favorites").set(auth);
    expect(res.body.data).toEqual([]);
  });

  it("responde 400 para corpo inválido", async () => {
    const res = await request(app).put("/api/me/favorites").set(auth).send({ placeIds: ["a"] });
    expect(res.statusCode).toBe(400);
  });

  it("não mistura favoritos de usuários diferentes", async () => {
    const other = createUser({ sub: "outro-fav", email: "outro@example.com" });
    await request(app).put("/api/me/favorites").set(other.auth).send({ placeIds: [P1] });
    const mine = await request(app).get("/api/me/favorites").set(auth);
    expect(mine.body.data).toEqual([]);
  });
});

describe("visitas", () => {
  const { auth } = createUser({ sub: "visitas", email: "visitas@example.com" });

  it("PUT /visits substitui a lista e preserva datas enviadas", async () => {
    const res = await request(app)
      .put("/api/me/visits")
      .set(auth)
      .send({
        visits: [
          { placeId: P1, rating: 5, note: "Adorei", visitedAt: "2026-10-01T12:00:00.000Z", updatedAt: "2026-10-02T12:00:00.000Z" },
          { placeId: P2, rating: null, note: "" },
          { placeId: 999999, rating: 3 },
        ],
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.find((v) => v.placeId === P1)).toEqual({
      placeId: P1,
      rating: 5,
      note: "Adorei",
      visitedAt: "2026-10-01T12:00:00.000Z",
      updatedAt: "2026-10-02T12:00:00.000Z",
    });
  });

  it("PUT /visits/:id atualiza nota e mantém a data da visita", async () => {
    const res = await request(app).put(`/api/me/visits/${P1}`).set(auth).send({ rating: 4, note: "Voltei" });
    expect(res.body.data).toMatchObject({ placeId: P1, rating: 4, note: "Voltei", visitedAt: "2026-10-01T12:00:00.000Z" });
  });

  it.each([
    [{ rating: 6 }],
    [{ rating: 2.5 }],
    [{ note: "x".repeat(281) }],
    [{ visitedAt: "ontem" }],
  ])("responde 400 para visita inválida %j", async (body) => {
    expect((await request(app).put(`/api/me/visits/${P1}`).set(auth).send(body)).statusCode).toBe(400);
  });

  it("DELETE /visits/:id remove", async () => {
    await request(app).delete(`/api/me/visits/${P2}`).set(auth);
    const res = await request(app).get("/api/me/visits").set(auth);
    expect(res.body.data.map((v) => v.placeId)).toEqual([P1]);
  });
});

describe("DELETE /api/me", () => {
  it("exclui a conta com favoritos, visitas e avaliações, e invalida o token", async () => {
    const { user, auth } = createUser({ sub: "excluir", email: "excluir@example.com" });
    await request(app).put("/api/me/favorites").set(auth).send({ placeIds: [P1] });
    await request(app).put(`/api/me/visits/${P1}`).set(auth).send({ rating: 5 });
    await request(app).put(`/api/places/${P1}/reviews`).set(auth).send({ rating: 5, comment: "Ótimo" });

    expect((await request(app).delete("/api/me").set(auth)).statusCode).toBe(204);

    const db = getDb();
    for (const table of ["user_favorites", "user_visits", "reviews"]) {
      expect(db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ?`).get(user.id).n).toBe(0);
    }
    expect((await request(app).get("/api/me").set(auth)).statusCode).toBe(401);
  });
});
