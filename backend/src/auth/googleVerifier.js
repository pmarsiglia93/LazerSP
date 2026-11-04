const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client();

/**
 * Valida um ID token do Google (assinatura, expiração, emissor e audiência)
 * e devolve os dados do usuário.
 *
 * Isolado em um módulo próprio para que os testes possam substituí-lo sem
 * acessar a rede.
 *
 * @param {string} idToken
 * @param {string[]} audience client IDs OAuth aceitos
 * @returns {Promise<{ sub: string, email: string, emailVerified: boolean, name: string, picture: string|null }>}
 */
async function verifyGoogleIdToken(idToken, audience) {
  const ticket = await client.verifyIdToken({ idToken, audience });
  const payload = ticket.getPayload();
  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: payload.name || "",
    picture: payload.picture || null,
  };
}

module.exports = { verifyGoogleIdToken };
