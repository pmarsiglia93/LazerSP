const { setupTestDb } = require("../helpers");
setupTestDb({ seeded: true });

const request = require("supertest");
const app = require("../../src/app");
const { places: seedPlaces } = require("../../src/database/seed");

describe("GET /", () => {
  it("retorna informações da API", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("LazerSP API");
  });

  it("envia headers de segurança e não expõe o Express", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toContain("connect-src 'self' https://nominatim.openstreetmap.org");
  });
});

describe("GET /api/places", () => {
  it("retorna todos os lugares do seed com a estrutura esperada", async () => {
    const res = await request(app).get("/api/places");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta).toEqual({ total: seedPlaces.length, limit: 50, offset: 0 });
    expect(res.body.data).toHaveLength(seedPlaces.length);

    const place = res.body.data[0];
    for (const key of ["id", "name", "category", "address", "imageUrl", "rating", "openingHours", "isOpen", "latitude", "longitude", "tags"]) {
      expect(place).toHaveProperty(key);
    }
    expect(typeof place.isOpen).toBe("boolean");
  });

  it("devolve as tags de cada lugar (consulta única, sem N+1)", async () => {
    const res = await request(app).get("/api/places");
    const ibirapuera = res.body.data.find((p) => p.name === "Parque Ibirapuera");
    expect(ibirapuera.tags).toEqual(["parque", "natureza", "esporte", "família", "gratuito"]);
    expect(res.body.data.every((p) => Array.isArray(p.tags) && p.tags.length > 0)).toBe(true);
  });

  it("ordena por avaliação, da maior para a menor", async () => {
    const res = await request(app).get("/api/places");
    const ratings = res.body.data.map((p) => p.rating);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it.each([
    ["-5", 50],
    ["abc", 50],
    ["999", 50],
    ["10", 10],
  ])("limit=%s resulta em limit %i", async (limit, expected) => {
    const res = await request(app).get("/api/places").query({ limit });
    expect(res.body.meta.limit).toBe(expected);
    expect(res.body.data.length).toBeLessThanOrEqual(expected);
  });

  it("pagina com offset sem repetir lugares", async () => {
    const first = await request(app).get("/api/places").query({ limit: 10, offset: 0 });
    const second = await request(app).get("/api/places").query({ limit: 10, offset: 10 });
    const firstIds = first.body.data.map((p) => p.id);
    const secondIds = second.body.data.map((p) => p.id);
    expect(second.body.meta.offset).toBe(10);
    expect(secondIds.some((id) => firstIds.includes(id))).toBe(false);
  });

  it("filtra por categoria", async () => {
    const res = await request(app).get("/api/places").query({ category: "Baladas" });
    expect(res.body.meta.total).toBe(seedPlaces.filter((p) => p.category === "Baladas").length);
    expect(res.body.data.every((p) => p.category === "Baladas")).toBe(true);
  });

  it('categoria "Todos" não filtra', async () => {
    const res = await request(app).get("/api/places").query({ category: "Todos" });
    expect(res.body.meta.total).toBe(seedPlaces.length);
  });

  it("filtra apenas lugares gratuitos", async () => {
    const res = await request(app).get("/api/places").query({ free: "true" });
    expect(res.body.meta.total).toBe(seedPlaces.filter((p) => p.price_level === "Gratuito").length);
    expect(res.body.data.every((p) => p.priceLevel === "Gratuito")).toBe(true);
  });

  it("busca pelo nome sem diferenciar maiúsculas", async () => {
    const res = await request(app).get("/api/places").query({ search: "ibirapuera" });
    expect(res.body.data.map((p) => p.name)).toContain("Parque Ibirapuera");
  });

  it("busca pelas tags", async () => {
    const res = await request(app).get("/api/places").query({ search: "ciclismo" });
    expect(res.body.data.map((p) => p.name)).toContain("Parque Villa-Lobos");
  });

  it("combina busca e categoria", async () => {
    const res = await request(app).get("/api/places").query({ search: "parque", category: "Museus" });
    expect(res.body.data.every((p) => p.category === "Museus")).toBe(true);
  });

  it.each(["%", "_", "\\"])('trata "%s" como texto literal, não como curinga', async (search) => {
    const res = await request(app).get("/api/places").query({ search });
    expect(res.body.meta.total).toBe(0);
  });

  it("retorna lista vazia quando nada corresponde", async () => {
    const res = await request(app).get("/api/places").query({ search: "xyz-inexistente" });
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });
});

describe("GET /api/places/categories", () => {
  it('retorna "Todos" seguido das categorias existentes, em ordem alfabética', async () => {
    const res = await request(app).get("/api/places/categories");
    const expected = [...new Set(seedPlaces.map((p) => p.category))].sort();
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(["Todos", ...expected]);
  });
});

describe("GET /api/places/:id", () => {
  it("retorna o lugar com as tags", async () => {
    const list = await request(app).get("/api/places").query({ search: "Ibirapuera" });
    const { id } = list.body.data[0];
    const res = await request(app).get(`/api/places/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.tags).toContain("parque");
  });

  it("retorna 404 com mensagem em português para ID inexistente", async () => {
    const res = await request(app).get("/api/places/99999");
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ success: false, error: "Lugar não encontrado" });
  });

  it.each(["abc", "0", "-1", "1.5"])("retorna 404 para ID inválido (%s)", async (id) => {
    const res = await request(app).get(`/api/places/${id}`);
    expect(res.statusCode).toBe(404);
  });
});

describe("rotas desconhecidas", () => {
  it("retorna 404", async () => {
    const res = await request(app).get("/api/inexistente");
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
