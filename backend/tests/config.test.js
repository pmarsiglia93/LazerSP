const { checkConfig, getAdminConfig, getGoogleConfig } = require("../src/config");

const VARS = ["NODE_ENV", "ADMIN_USER", "ADMIN_PASSWORD", "ADMIN_PASSWORD_HASH", "JWT_SECRET", "ALLOWED_ORIGINS", "GOOGLE_CLIENT_IDS"];
const LONG_SECRET = "x".repeat(40);
const VALID_HASH = "$2b$04$abcdefghijklmnopqrstuuMSSfH8x7m8a3n6k5JQkY7v0w1z2y3Cd";

describe("config", () => {
  const saved = {};
  beforeEach(() => {
    for (const name of VARS) {
      saved[name] = process.env[name];
      delete process.env[name];
    }
  });
  afterEach(() => {
    for (const name of VARS) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  });

  it("desativa o painel e lista o que falta quando nada está configurado", () => {
    const admin = getAdminConfig();
    expect(admin.enabled).toBe(false);
    expect(admin.problems).toEqual([
      "ADMIN_USER não definido",
      "ADMIN_PASSWORD_HASH (ou ADMIN_PASSWORD) não definido",
      "JWT_SECRET não definido",
    ]);
    expect(checkConfig()[0]).toMatch(/^Painel administrativo desativado/);
  });

  it("remove espaços e quebras de linha das variáveis", () => {
    Object.assign(process.env, { ADMIN_USER: " admin\n", ADMIN_PASSWORD: "senha ", JWT_SECRET: LONG_SECRET });
    const admin = getAdminConfig();
    expect(admin.user).toBe("admin");
    expect(admin.password).toBe("senha");
  });

  it("rejeita ADMIN_PASSWORD_HASH que não é bcrypt", () => {
    Object.assign(process.env, { ADMIN_USER: "a", ADMIN_PASSWORD_HASH: "texto-puro", JWT_SECRET: LONG_SECRET });
    expect(getAdminConfig().problems).toContain("ADMIN_PASSWORD_HASH não é um hash bcrypt válido");
  });

  it("avisa sobre senha em texto puro e segredo curto", () => {
    Object.assign(process.env, { ADMIN_USER: "a", ADMIN_PASSWORD: "b", JWT_SECRET: "curto" });
    const warnings = checkConfig();
    expect(warnings.some((w) => w.includes("ADMIN_PASSWORD em texto puro"))).toBe(true);
    expect(warnings.some((w) => w.includes("JWT_SECRET tem menos de 32"))).toBe(true);
  });

  it("não avisa nada com a configuração recomendada", () => {
    Object.assign(process.env, {
      ADMIN_USER: "a",
      ADMIN_PASSWORD_HASH: VALID_HASH,
      JWT_SECRET: LONG_SECRET,
      GOOGLE_CLIENT_IDS: "web.apps.googleusercontent.com",
    });
    expect(checkConfig()).toEqual([]);
  });

  it("avisa quando o login com Google não está configurado e separa os client IDs", () => {
    expect(checkConfig()).toContain("Login com Google desativado: defina GOOGLE_CLIENT_IDS e JWT_SECRET.");
    Object.assign(process.env, { GOOGLE_CLIENT_IDS: " web.id , android.id ,", JWT_SECRET: LONG_SECRET });
    expect(getGoogleConfig()).toMatchObject({ clientIds: ["web.id", "android.id"], enabled: true });
  });

  it("avisa quando ALLOWED_ORIGINS está vazio em produção", () => {
    process.env.NODE_ENV = "production";
    expect(checkConfig().some((w) => w.startsWith("ALLOWED_ORIGINS vazio"))).toBe(true);
  });
});
