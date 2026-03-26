require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initDb } = require("./database/db");
const placesRouter = require("./routes/places");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const morgan = require("morgan");

const app = express();

const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean)
      : true,
  methods: ["GET"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
// Logging de requisições HTTP
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

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
    },
  });
});

app.use("/api/places", placesRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
