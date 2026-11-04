const { setupTestDb, configureGoogle, configureAdmin, createUser, TEST_SECRET } = require("../helpers");
setupTestDb({ seeded: true });
configureGoogle();
configureAdmin();

const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../../src/app");
const { getDb } = require("../../src/database/db");

const [PLACE, OTHER_PLACE] = getDb().prepare("SELECT id FROM places ORDER BY id LIMIT 2").all().map((r) => r.id);
const adminAuth = {
  Authorization: `Bearer ${jwt.sign({ sub: "admin", role: "admin" }, TEST_SECRET, { algorithm: "HS256" })}`,
};

const maria = createUser({ sub: "maria", email: "maria@example.com", name: "Maria da Silva Souza" });
const joao = createUser({ sub: "joao", email: "joao@example.com", name: "João" });

const reviews = (id = PLACE, auth = {}) => request(app).get(`/api/places/${id}/reviews`).set(auth);
const writeReview = (auth, body, id = PLACE) => request(app).put(`/api/places/${id}/reviews`).set(auth).send(body);

describe("avaliações públicas", () => {
  it("lista vazia e sem média para lugar sem avaliações", async () => {
    const res = await reviews();
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ data: [], mine: null, meta: { total: 0, average: null } });
  });

  it("responde 404 para lugar inexistente", async () => {
    expect((await reviews(999999)).statusCode).toBe(404);
  });

  it("exige login para avaliar", async () => {
    expect((await writeReview({}, { rating: 5 })).statusCode).toBe(401);
  });

  it.each([[{ rating: 0 }], [{ rating: 6 }], [{ rating: 4.5 }], [{}], [{ rating: 5, comment: "x".repeat(501) }]])(
    "responde 400 para avaliação inválida %j",
    async (body) => {
      expect((await writeReview(maria.auth, body)).statusCode).toBe(400);
    }
  );

  it("cria a avaliação com nome público abreviado e sem e-mail", async () => {
    const res = await writeReview(maria.auth, { rating: 5, comment: "  Lugar incrível  " });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toMatchObject({ rating: 5, comment: "Lugar incrível", status: "published", author: { name: "Maria S." } });
    expect(JSON.stringify(res.body)).not.toContain("maria@example.com");
  });

  it("edita a própria avaliação em vez de criar outra", async () => {
    await writeReview(maria.auth, { rating: 4, comment: "Mudei de ideia" });
    const res = await reviews();
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0]).toMatchObject({ rating: 4, comment: "Mudei de ideia" });
  });

  it("calcula a média e mostra a avaliação do próprio usuário em `mine`", async () => {
    await writeReview(joao.auth, { rating: 3 });
    const res = await reviews(PLACE, maria.auth);
    expect(res.body.meta).toMatchObject({ total: 2, average: 3.5 });
    expect(res.body.mine).toMatchObject({ rating: 4, author: { name: "Maria S." } });
    expect(res.body.data.map((r) => r.author.name).sort()).toEqual(["João", "Maria S."]);
  });

  it("inclui o resumo das avaliações nos dados do lugar", async () => {
    const detail = await request(app).get(`/api/places/${PLACE}`);
    expect(detail.body.data.reviews).toEqual({ average: 3.5, count: 2 });
    const list = await request(app).get("/api/places").query({ limit: 200 });
    expect(list.body.data.find((p) => p.id === OTHER_PLACE).reviews).toEqual({ average: null, count: 0 });
  });

  it("remove a própria avaliação", async () => {
    expect((await request(app).delete(`/api/places/${PLACE}/reviews`).set(joao.auth)).statusCode).toBe(204);
    const res = await reviews();
    expect(res.body.meta).toMatchObject({ total: 1, average: 4 });
  });
});

describe("moderação no painel", () => {
  let reviewId;
  beforeAll(async () => {
    const res = await writeReview(joao.auth, { rating: 1, comment: "spam spam" }, OTHER_PLACE);
    reviewId = res.body.data.id;
  });

  it("exige token de admin", async () => {
    expect((await request(app).get("/api/admin/reviews").set(maria.auth)).statusCode).toBe(401);
  });

  it("lista avaliações com lugar e e-mail do autor", async () => {
    const res = await request(app).get("/api/admin/reviews").set(adminAuth);
    const review = res.body.data.find((r) => r.id === reviewId);
    expect(review).toMatchObject({ status: "published", author: { email: "joao@example.com" }, place: { id: OTHER_PLACE } });
  });

  it("oculta uma avaliação, que some da lista pública e da média", async () => {
    const res = await request(app).patch(`/api/admin/reviews/${reviewId}`).set(adminAuth).send({ status: "hidden" });
    expect(res.statusCode).toBe(200);
    const pub = await reviews(OTHER_PLACE);
    expect(pub.body.meta).toMatchObject({ total: 0, average: null });
  });

  it("o autor ainda vê a própria avaliação oculta, e editar não a republica", async () => {
    await writeReview(joao.auth, { rating: 2, comment: "editada" }, OTHER_PLACE);
    const res = await reviews(OTHER_PLACE, joao.auth);
    expect(res.body.mine).toMatchObject({ status: "hidden", comment: "editada" });
    expect(res.body.meta.total).toBe(0);
  });

  it("filtra por status", async () => {
    const res = await request(app).get("/api/admin/reviews").query({ status: "hidden" }).set(adminAuth);
    expect(res.body.data.map((r) => r.id)).toEqual([reviewId]);
  });

  it("responde 400 para status inválido e 404 para avaliação inexistente", async () => {
    expect((await request(app).patch(`/api/admin/reviews/${reviewId}`).set(adminAuth).send({ status: "x" })).statusCode).toBe(400);
    expect((await request(app).patch("/api/admin/reviews/999999").set(adminAuth).send({ status: "hidden" })).statusCode).toBe(404);
  });

  it("exclui uma avaliação", async () => {
    expect((await request(app).delete(`/api/admin/reviews/${reviewId}`).set(adminAuth)).statusCode).toBe(204);
    expect((await request(app).delete(`/api/admin/reviews/${reviewId}`).set(adminAuth)).statusCode).toBe(404);
  });
});

describe("limite de escrita", () => {
  it("bloqueia com 429 depois de 20 avaliações em uma hora pelo mesmo usuário", async () => {
    const spammer = createUser({ sub: "spammer", email: "spam@example.com" });
    for (let i = 0; i < 20; i++) {
      expect((await writeReview(spammer.auth, { rating: 5 })).statusCode).toBe(200);
    }
    expect((await writeReview(spammer.auth, { rating: 5 })).statusCode).toBe(429);
    // Outro usuário continua podendo avaliar
    expect((await writeReview(maria.auth, { rating: 5 })).statusCode).toBe(200);
  });
});
