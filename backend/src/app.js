// Os testes controlam o próprio ambiente e não leem o .env local
if (process.env.NODE_ENV !== "test") require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDb } = require("./database/db");
const placesRouter = require("./routes/places");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const meRouter = require("./routes/me");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit").default;
const { isProduction, getAllowedOrigins } = require("./config");

const app = express();

// Atrás do proxy do Railway, o IP real do cliente vem em X-Forwarded-For.
// Necessário para o rate limit contar por cliente, e não pelo proxy.
const trustProxy = process.env.TRUST_PROXY ?? (isProduction() ? "1" : "0");
app.set("trust proxy", /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);

// Headers de segurança. A CSP libera o que o painel /admin usa fora da origem:
// imagens externas (pré-visualização da foto) e a geocodificação no Nominatim.
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "img-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'", "https://nominatim.openstreetmap.org"],
        // Desligado para o painel continuar funcionando em http://localhost (Docker local)
        "upgrade-insecure-requests": null,
      },
    },
  })
);

const corsOptions = {
  origin: isProduction() ? getAllowedOrigins() : true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(isProduction() ? "combined" : "dev"));
}

// Limite generoso para a API pública: protege contra abuso sem afetar o uso
// normal do app (várias pessoas podem compartilhar o mesmo IP na rede móvel).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT) || 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: "Muitas requisições. Tente novamente em alguns minutos." },
});
app.use("/api", apiLimiter);

initDb();

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LazerSP API",
    version: "1.0.0",
    endpoints: {
      places: "/api/places",
      placeById: "/api/places/:id",
      categories: "/api/places/categories",
      admin: "/admin",
    },
  });
});

app.use("/api/places", placesRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/me", meRouter);

// Serve admin panel static files
const adminDist = path.join(__dirname, "../public/admin");
app.use("/admin", express.static(adminDist));
app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(adminDist, "index.html"));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
