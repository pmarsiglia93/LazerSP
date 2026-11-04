const { setupTestDb, configureAdmin, TEST_SECRET } = require("../helpers");
setupTestDb({ seeded: true });
configureAdmin();

const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../../src/app");
const { getDb } = require("../../src/database/db");

const token = jwt.sign({ sub: "admin", role: "admin" }, TEST_SECRET, { algorithm: "HS256", expiresIn: "1h" });
const auth = { Authorization: `Bearer ${token}` };

const countPlaces = () => getDb().prepare("SELECT COUNT(*) AS n FROM places").get().n;
const countTags = () => getDb().prepare("SELECT COUNT(*) AS n FROM tags").get().n;

const validPlace = {
  name: "Bar de Teste",
  category: "Bares",
  address: "Rua Augusta, 1000 - Consolação, São Paulo",
  description: "Bar criado pelos testes.",
  imageUrl: "https://images.unsplash.com/photo-1?w=800",
  rating: 4.2,
  openingHours: "Ter-Sáb 18:00 - 02:00",
  priceLevel: "$$",
  highlight: "Drinks autorais.",
  isOpen: true,
  latitude: -23.5536,
  longitude: -46.6577,
  instagram: "@bardeteste",
  tags: ["drinks", " noite ", "drinks"],
};

describe("autenticação das rotas de admin", () => {
  it("responde 401 sem token", async () => {
    const res = await request(app).post("/api/admin/places").send(validPlace);
    expect(res.statusCode).toBe(401);
  });

  it("responde 401 com token assinado por outro segredo", async () => {
    const forged = jwt.sign({ sub: "admin", role: "admin" }, "outro-segredo-qualquer-com-32-caracteres");
    const res = await request(app).delete("/api/admin/places/1").set("Authorization", `Bearer ${forged}`);
    expect(res.statusCode).toBe(401);
  });

  it("responde 401 com token expirado", async () => {
    const expired = jwt.sign({ sub: "admin", role: "admin", exp: Math.floor(Date.now() / 1000) - 60 }, TEST_SECRET);
    const res = await request(app).delete("/api/admin/places/1").set("Authorization", `Bearer ${expired}`);
    expect(res.statusCode).toBe(401);
  });

  it("responde 401 para token no formato antigo, sem papel (força novo login)", async () => {
    const legacy = jwt.sign({ username: "admin" }, TEST_SECRET);
    const res = await request(app).delete("/api/admin/places/1").set("Authorization", `Bearer ${legacy}`);
    expect(res.statusCode).toBe(401);
  });

  it("rejeita o algoritmo none", async () => {
    const unsigned = jwt.sign({ sub: "admin", role: "admin" }, null, { algorithm: "none" });
    const res = await request(app).delete("/api/admin/places/1").set("Authorization", `Bearer ${unsigned}`);
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /api/admin/places", () => {
  it("cria o lugar com tags normalizadas e Instagram sem @", async () => {
    const before = countPlaces();
    const res = await request(app).post("/api/admin/places").set(auth).send(validPlace);
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toMatchObject({
      name: "Bar de Teste",
      category: "Bares",
      rating: 4.2,
      instagram: "bardeteste",
      tags: ["drinks", "noite"],
    });
    expect(countPlaces()).toBe(before + 1);
  });

  it("aceita valores numéricos enviados como texto", async () => {
    const res = await request(app)
      .post("/api/admin/places")
      .set(auth)
      .send({ ...validPlace, name: "Numérico", rating: "3.5", latitude: "-23.55", longitude: "-46.63" });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.rating).toBe(3.5);
  });

  it("aplica valores padrão nos campos opcionais", async () => {
    const res = await request(app)
      .post("/api/admin/places")
      .set(auth)
      .send({ name: "Mínimo", category: "Parques", address: "Rua X", latitude: -23.5, longitude: -46.6 });
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toMatchObject({ priceLevel: "Gratuito", rating: 0, instagram: null, tags: [] });
  });

  it("status fica null quando o horário é texto livre", async () => {
    const res = await request(app)
      .post("/api/admin/places")
      .set(auth)
      .send({ ...validPlace, name: "Teatro Teste", openingHours: "Conforme programação" });
    expect(res.body.data.isOpen).toBeNull();
  });

  it("usa o status manual quando o horário está vazio", async () => {
    const res = await request(app)
      .post("/api/admin/places")
      .set(auth)
      .send({ ...validPlace, name: "Sem Horário", openingHours: "", isOpen: false });
    expect(res.body.data.isOpen).toBe(false);
  });

  it.each([
    ["sem nome", { name: "" }, "Nome é obrigatório"],
    ["sem categoria", { category: undefined }, "Categoria é obrigatório"],
    ["avaliação acima de 5", { rating: 999 }, "Avaliação deve ser no máximo 5"],
    ["latitude não numérica", { latitude: "abc" }, "Latitude é inválido"],
    ["latitude fora do intervalo", { latitude: -200 }, "Latitude deve ser no mínimo -90"],
    ["localização zerada", { latitude: 0, longitude: 0 }, "Informe a localização (latitude e longitude)"],
    ["URL de imagem javascript:", { imageUrl: "javascript:alert(1)" }, "URL da imagem deve ser um endereço http(s) válido"],
    ["tags que não são texto", { tags: [1, 2] }, "Tags é inválido"],
    ["Instagram com URL", { instagram: "https://instagram.com/x" }, "Instagram é inválido"],
  ])("responde 400 e não grava nada: %s", async (_case, override, message) => {
    const before = { places: countPlaces(), tags: countTags() };
    const res = await request(app).post("/api/admin/places").set(auth).send({ ...validPlace, ...override });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toContain(message);
    expect(res.body.error).toBe(res.body.errors[0]);
    expect({ places: countPlaces(), tags: countTags() }).toEqual(before);
  });
});

describe("PUT /api/admin/places/:id", () => {
  let id;
  beforeAll(async () => {
    const res = await request(app).post("/api/admin/places").set(auth).send({ ...validPlace, name: "Para Editar" });
    id = res.body.data.id;
  });

  it("atualiza os dados e substitui as tags", async () => {
    const res = await request(app)
      .put(`/api/admin/places/${id}`)
      .set(auth)
      .send({ ...validPlace, name: "Editado", tags: ["nova"] });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toMatchObject({ id, name: "Editado", tags: ["nova"] });
  });

  it("não altera nada quando a validação falha", async () => {
    const res = await request(app).put(`/api/admin/places/${id}`).set(auth).send({ ...validPlace, name: "" });
    expect(res.statusCode).toBe(400);
    const current = await request(app).get(`/api/places/${id}`);
    expect(current.body.data).toMatchObject({ name: "Editado", tags: ["nova"] });
  });

  it("responde 404 para lugar inexistente", async () => {
    const res = await request(app).put("/api/admin/places/99999").set(auth).send(validPlace);
    expect(res.statusCode).toBe(404);
  });

  it("responde 404 para ID inválido", async () => {
    const res = await request(app).put("/api/admin/places/abc").set(auth).send(validPlace);
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /api/admin/places/:id", () => {
  it("remove o lugar e suas tags", async () => {
    const created = await request(app).post("/api/admin/places").set(auth).send({ ...validPlace, name: "Para Remover" });
    const { id } = created.body.data;

    const res = await request(app).delete(`/api/admin/places/${id}`).set(auth);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('"Para Remover" removido com sucesso');
    expect((await request(app).get(`/api/places/${id}`)).statusCode).toBe(404);
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM tags WHERE place_id = ?").get(id).n).toBe(0);
  });

  it("responde 404 para lugar inexistente", async () => {
    const res = await request(app).delete("/api/admin/places/99999").set(auth);
    expect(res.statusCode).toBe(404);
  });
});
