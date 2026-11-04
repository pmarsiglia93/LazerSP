/** Dados do próprio usuário (inclui e-mail). */
function formatMe(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url || null,
    createdAt: row.created_at,
  };
}

/**
 * Nome exibido publicamente nas avaliações: primeiro nome e inicial do
 * sobrenome ("Paulo M."). O e-mail nunca aparece em dados públicos.
 */
function publicName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Usuário";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

module.exports = { formatMe, publicName };
