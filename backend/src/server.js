const app = require("./app");
const { checkConfig } = require("./config");

const PORT = process.env.PORT || 3000;

for (const warning of checkConfig()) {
  console.warn(`⚠️  ${warning}`);
}

app.listen(PORT, () => {
  console.log(`🚀 LazerSP API rodando em http://localhost:${PORT}`);
  console.log(`📦 Ambiente: ${process.env.NODE_ENV || "development"}`);
});
