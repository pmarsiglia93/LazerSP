/**
 * Complementa o app.json com configurações que dependem de variáveis de ambiente.
 *
 * GOOGLE_IOS_URL_SCHEME: "reversed client ID" do client OAuth iOS do Google
 * (com.googleusercontent.apps.XXXX). Sem ele, o build iOS sai sem login com
 * Google; o Android não precisa desta variável.
 */
module.exports = ({ config }) => {
  const plugins = [...(config.plugins ?? [])];
  const iosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;

  if (iosUrlScheme) {
    plugins.push(["@react-native-google-signin/google-signin", { iosUrlScheme }]);
  }

  return { ...config, plugins };
};
