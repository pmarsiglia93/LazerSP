require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDb } = require("./database/db");
const placesRouter = require("./routes/places");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const morgan = require("morgan");

const app = express();

const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean)
      : true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
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
      admin: "/admin",
    },
  });
});

app.use("/api/places", placesRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

// Serve admin panel static files
const adminDist = path.join(__dirname, "../public/admin");
app.use("/admin", express.static(adminDist));
app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(adminDist, "index.html"));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
