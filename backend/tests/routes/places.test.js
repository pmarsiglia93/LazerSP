const path = require("path");
const fs = require("fs");

// Define o banco de dados de teste ANTES de qualquer require do app
const TEST_DB = path.join(__dirname, "lazersp.test.db");
process.env.DB_PATH = TEST_DB;
process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../../src/app");

afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  // Remove arquivos WAL se existirem
  ["-shm", "-wal"].forEach((ext) => {
    const f = TEST_DB + ext;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
});

describe("GET /", () => {
  it("retorna informações da API", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("LazerSP API");
  });
});

describe("GET /api/places", () => {
  it("responde com estrutura correta mesmo com banco vazio", async () => {
    const res = await request(app).get("/api/places");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty("total");
    expect(res.body.meta).toHaveProperty("limit");
    expect(res.body.meta).toHaveProperty("offset");
  });

  it("usa limit padrão 50 quando não informado", async () => {
    const res = await request(app).get("/api/places");
    expect(res.body.meta.limit).toBe(50);
  });

  it("usa limit padrão 50 para valor inválido negativo", async () => {
    const res = await request(app).get("/api/places?limit=-5");
    expect(res.body.meta.limit).toBe(50);
  });

  it("usa limit padrão 50 para valor não numérico", async () => {
    const res = await request(app).get("/api/places?limit=abc");
    expect(res.body.meta.limit).toBe(50);
  });

  it("respeita limit máximo de 200", async () => {
    const res = await request(app).get("/api/places?limit=999");
    expect(res.body.meta.limit).toBe(50);
  });

  it("aceita limit válido", async () => {
    const res = await request(app).get("/api/places?limit=10");
    expect(res.body.meta.limit).toBe(10);
  });

  it("aceita offset válido", async () => {
    const res = await request(app).get("/api/places?offset=5");
    expect(res.body.meta.offset).toBe(5);
  });
});

describe("GET /api/places/categories", () => {
  it("retorna lista de categorias contendo Todos", async () => {
    const res = await request(app).get("/api/places/categories");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toContain("Todos");
  });
});

describe("GET /api/places/:id", () => {
  it("retorna 404 para ID inexistente", async () => {
    const res = await request(app).get("/api/places/99999");
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("retorna 404 com mensagem em português", async () => {
    const res = await request(app).get("/api/places/99999");
    expect(res.body.error).toMatch(/não encontrado/i);
  });
});

describe("Rota inexistente", () => {
  it("retorna 404 para rota desconhecida", async () => {
    const res = await request(app).get("/api/inexistente");
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
