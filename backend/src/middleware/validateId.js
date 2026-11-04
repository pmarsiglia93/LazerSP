/**
 * Handler para `router.param("id", ...)`: IDs que não são inteiros positivos
 * respondem 404 sem chegar ao banco.
 */
function validateId(req, res, next, id) {
  if (!/^[1-9]\d{0,15}$/.test(id)) {
    const error = new Error("Lugar não encontrado");
    error.status = 404;
    return next(error);
  }
  next();
}

module.exports = { validateId };
