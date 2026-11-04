const { setupTestDb } = require("../helpers");
setupTestDb({ seeded: true });

const { getDb } = require("../../src/database/db");
const { applyDataMigrations } = require("../../src/database/dataMigrations");
const { NOVOS_LUGARES } = require("../../src/database/data/2026-11-novos-lugares");
const { places: SEED } = require("../../src/database/seed");

const count = () => getDb().prepare("SELECT COUNT(*) AS n FROM places").get().n;
const tagsOf = (name) =>
  getDb()
    .prepare("SELECT t.name FROM tags t JOIN places p ON p.id = t.place_id WHERE p.name = ? ORDER BY t.id")
    .all(name)
    .map((r) => r.name);

describe("dados de novembro de 2026", () => {
  it("têm 60 lugares com nomes únicos e sem repetir o seed", () => {
    const names = NOVOS_LUGARES.map((p) => p.name.toLowerCase());
    expect(NOVOS_LUGARES).toHaveLength(60);
    expect(new Set(names).size).toBe(60);
    const seedNames = new Set(SEED.map((p) => p.name.toLowerCase()));
    expect(names.filter((n) => seedNames.has(n))).toEqual([]);
  });

  it.each(NOVOS_LUGARES.map((p) => [p.name, p]))("%s tem os campos obrigatórios e coordenadas em São Paulo", (_n, p) => {
    for (const key of ["name", "category", "address", "description", "image_url", "opening_hours", "price_level", "highlight", "fonte"]) {
      expect(typeof p[key]).toBe("string");
      expect(p[key].length).toBeGreaterThan(0);
    }
    expect(p.image_url).toMatch(/^https:\/\//);
    expect(p.tags.length).toBeGreaterThan(0);
    // Limites aproximados do município de São Paulo
    expect(p.latitude).toBeGreaterThan(-24.01);
    expect(p.latitude).toBeLessThan(-23.35);
    expect(p.longitude).toBeGreaterThan(-46.83);
    expect(p.longitude).toBeLessThan(-46.36);
  });
});

describe("applyDataMigrations", () => {
  it("insere os 60 lugares novos com tags", () => {
    const before = count();
    const [result] = applyDataMigrations();
    expect(result).toEqual({ id: "2026-11-novos-lugares", inserted: 60, skipped: [] });
    expect(count()).toBe(before + 60);
    expect(tagsOf("Sesc Pompeia")).toEqual(["sesc", "centro cultural", "arquitetura", "shows", "gratuito"]);
  });

  it("não roda o mesmo lote duas vezes", () => {
    const before = count();
    expect(applyDataMigrations()).toEqual([]);
    expect(count()).toBe(before);
  });

  it("não reinsere um lugar removido depois da migração", () => {
    getDb().prepare("DELETE FROM places WHERE name = ?").run("Praça Roosevelt");
    applyDataMigrations();
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM places WHERE name = ?").get("Praça Roosevelt").n).toBe(0);
  });

  it("ignora lugares que já existem com o mesmo nome, sem diferenciar maiúsculas", () => {
    const migrations = [
      {
        id: "teste-duplicado",
        places: [
          { ...NOVOS_LUGARES[0], name: "  PARQUE IBIRAPUERA " },
          { ...NOVOS_LUGARES[0], name: "Lugar Inédito" },
        ],
      },
    ];
    const [result] = applyDataMigrations({ migrations });
    expect(result).toEqual({ id: "teste-duplicado", inserted: 1, skipped: ["  PARQUE IBIRAPUERA "] });
  });

  it("desfaz o lote inteiro se uma inserção falhar", () => {
    const before = count();
    const migrations = [
      {
        id: "teste-com-erro",
        places: [
          { ...NOVOS_LUGARES[0], name: "Válido" },
          { ...NOVOS_LUGARES[0], name: "Sem endereço", address: null },
        ],
      },
    ];
    expect(() => applyDataMigrations({ migrations })).toThrow();
    expect(count()).toBe(before);
    expect(getDb().prepare("SELECT 1 FROM data_migrations WHERE id = ?").get("teste-com-erro")).toBeUndefined();
  });
});
