const { setupTestDb, configureGoogle, TEST_SECRET } = require("../helpers");
setupTestDb();

jest.mock("../../src/auth/googleVerifier", () => ({ verifyGoogleIdToken: jest.fn() }));

const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../../src/app");
const { getDb } = require("../../src/database/db");
const { verifyGoogleIdToken } = require("../../src/auth/googleVerifier");

const ID_TOKEN = "header.payload.signature-do-google";
const PROFILE = {
  sub: "1234567890",
  email: "joana@gmail.com",
  emailVerified: true,
  name: "Joana Pereira",
  picture: "https://lh3.googleusercontent.com/a/foto",
};

const loginGoogle = (body = { idToken: ID_TOKEN }) => request(app).post("/api/auth/google").send(body);

describe("POST /api/auth/google", () => {
  beforeEach(() => {
    delete process.env.GOOGLE_CLIENT_IDS;
    verifyGoogleIdToken.mockReset();
    verifyGoogleIdToken.mockResolvedValue(PROFILE);
  });

  it("responde 503 quando o login com Google não está configurado", async () => {
    const res = await loginGoogle();
    expect(res.statusCode).toBe(503);
    expect(verifyGoogleIdToken).not.toHaveBeenCalled();
  });

  it("responde 400 sem idToken", async () => {
    configureGoogle();
    expect((await loginGoogle({})).statusCode).toBe(400);
  });

  it("responde 401 quando o Google rejeita o token", async () => {
    configureGoogle();
    verifyGoogleIdToken.mockRejectedValue(new Error("Token used too late"));
    const res = await loginGoogle();
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Login com Google inválido ou expirado");
  });

  it("responde 401 para e-mail não verificado", async () => {
    configureGoogle();
    verifyGoogleIdToken.mockResolvedValue({ ...PROFILE, emailVerified: false });
    expect((await loginGoogle()).statusCode).toBe(401);
  });

  it("valida o token contra todos os client IDs configurados", async () => {
    configureGoogle({ GOOGLE_CLIENT_IDS: "web.id,android.id,ios.id" });
    await loginGoogle();
    expect(verifyGoogleIdToken).toHaveBeenCalledWith(ID_TOKEN, ["web.id", "android.id", "ios.id"]);
  });

  it("cria o usuário no primeiro login e devolve token de usuário por 30 dias", async () => {
    configureGoogle();
    const res = await loginGoogle();
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toMatchObject({ email: PROFILE.email, name: PROFILE.name, avatarUrl: PROFILE.picture });

    const payload = jwt.verify(res.body.token, TEST_SECRET, { algorithms: ["HS256"] });
    expect(payload.role).toBe("user");
    expect(payload.sub).toBe(String(res.body.user.id));
    expect(payload.exp - payload.iat).toBe(30 * 24 * 60 * 60);
  });

  it("atualiza o mesmo usuário nos logins seguintes, sem duplicar", async () => {
    configureGoogle();
    const first = await loginGoogle();
    verifyGoogleIdToken.mockResolvedValue({ ...PROFILE, name: "Joana P. Souza" });
    const second = await loginGoogle();

    expect(second.body.user.id).toBe(first.body.user.id);
    expect(second.body.user.name).toBe("Joana P. Souza");
    expect(getDb().prepare("SELECT COUNT(*) AS n FROM users").get().n).toBe(1);
  });

  it("o token de usuário não dá acesso ao painel administrativo", async () => {
    configureGoogle();
    const { token } = (await loginGoogle()).body;
    const res = await request(app).delete("/api/admin/places/1").set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });
});
