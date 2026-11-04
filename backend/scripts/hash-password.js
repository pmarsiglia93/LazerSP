/**
 * Gera o hash bcrypt para a variável ADMIN_PASSWORD_HASH.
 *
 * Uso:
 *   npm run hash-password -- "sua-senha"
 *   echo "sua-senha" | npm run hash-password   (evita a senha no histórico do shell)
 */
const bcrypt = require("bcryptjs");

async function readStdin() {
  if (process.stdin.isTTY) return "";
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString().replace(/\r?\n$/, "");
}

async function main() {
  const password = process.argv[2] || (await readStdin());
  if (!password) {
    console.error('Uso: npm run hash-password -- "sua-senha"');
    process.exit(1);
  }
  console.log(await bcrypt.hash(password, 12));
}

main();
