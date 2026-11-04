const app = require("./app");
const { checkConfig } = require("./config");
const { seed } = require("./database/seed");
const { applyDataMigrations } = require("./database/dataMigrations");

const PORT = process.env.PORT || 3000;

for (const warning of checkConfig()) {
  console.warn(`⚠️  ${warning}`);
}

// Banco vazio recebe os lugares iniciais; depois, os lotes novos pendentes.
// As duas etapas são idempotentes e rápidas.
seed({ silent: true });
for (const { id, inserted, skipped } of applyDataMigrations()) {
  console.log(`🗂️  Migração de dados ${id}: ${inserted} lugares inseridos${skipped.length ? `, ${skipped.length} já existiam` : ""}.`);
}

app.listen(PORT, () => {
  console.log(`🚀 LazerSP API rodando em http://localhost:${PORT}`);
  console.log(`📦 Ambiente: ${process.env.NODE_ENV || "development"}`);
});
