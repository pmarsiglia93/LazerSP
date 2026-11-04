const { errorHandler } = require("../../src/middleware/errorHandler");

function run(err, nodeEnv) {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    errorHandler(err, { method: "GET", originalUrl: "/x" }, res, () => {});
  } finally {
    process.env.NODE_ENV = previous;
  }
  return { res, logged: spy.mock.calls.length > 0, restore: () => spy.mockRestore() };
}

describe("errorHandler", () => {
  afterEach(() => jest.restoreAllMocks());

  it("em produção esconde a mensagem de erros 500, mas registra no log", () => {
    const { res, logged } = run(new Error("tag.trim is not a function"), "production");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Erro interno do servidor" });
    expect(logged).toBe(true);
  });

  it("em produção mantém a mensagem de erros 4xx", () => {
    const err = Object.assign(new Error("Lugar não encontrado"), { status: 404 });
    const { res, logged } = run(err, "production");
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "Lugar não encontrado" });
    expect(logged).toBe(false);
  });

  it("em desenvolvimento mostra a mensagem e o stack", () => {
    const { res } = run(new Error("detalhe interno"), "development");
    const body = res.json.mock.calls[0][0];
    expect(body.error).toBe("detalhe interno");
    expect(body.stack).toBeDefined();
  });

  it("converte erro de JSON malformado em 400", () => {
    const err = Object.assign(new SyntaxError("Unexpected token"), { status: 400, type: "entity.parse.failed" });
    const { res } = run(err, "production");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "JSON inválido no corpo da requisição" });
  });
});
