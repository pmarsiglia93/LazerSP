const { isProduction } = require("../config");

function notFound(req, res, next) {
  const error = new Error(`Rota não encontrada: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Erro interno do servidor";

  // Corpo JSON malformado (lançado pelo express.json)
  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "JSON inválido no corpo da requisição";
  }

  if (status >= 500) {
    // Erros inesperados sempre vão para o log, mas o detalhe não é exposto
    // ao cliente em produção.
    if (process.env.NODE_ENV !== "test") {
      console.error(`[${status}] ${req.method} ${req.originalUrl}:`, err);
    }
    if (isProduction()) message = "Erro interno do servidor";
  }

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
