# LazerSP · App mobile

App React Native (Expo SDK 54, React Native 0.81, React 19) do LazerSP, guia de lazer urbano de São Paulo. Visão geral do projeto, backend e painel administrativo no [README da raiz](../README.md).

## Como rodar

```bash
cp .env.example .env   # ajuste EXPO_PUBLIC_API_URL com o IP da sua máquina
npm install
npx expo start
```

- `a`: abre no emulador Android
- `w`: abre a versão web (o mapa não é exibido na web)
- QR code: abre no Expo Go, com celular e computador na mesma rede Wi-Fi

O backend precisa estar rodando (veja `../backend`).

## Configuração da API

A URL da API é resolvida em `src/services/api.js`, nesta ordem:

1. `EXPO_PUBLIC_API_URL` do `.env`
2. IP do Metro bundler (modo LAN)
3. Fallback por plataforma: `10.0.2.2` no emulador Android, `localhost` na web e no simulador iOS

## Telas

| Tela | Arquivo | O que faz |
|------|---------|-----------|
| Splash | `src/screens/SplashScreen.js` | Apresentação e entrada no app |
| Explorar | `src/screens/HomeScreen.js` | Lista com busca, filtros, ordenação por distância e busca por endereço quando o GPS está desligado |
| Detalhes | `src/screens/DetailsScreen.js` | Informações do lugar, favoritar, marcar visita com nota, Google Maps, Uber e Instagram |
| Favoritos | `src/screens/FavoritesScreen.js` | Lugares salvos no aparelho |
| Mapa | `src/screens/MapScreen.js` | Marcadores de todos os lugares (`MapScreen.web.js` substitui na web) |

## Estado e dados

- `src/context/LocationContext.js`: permissão, posição atual e cálculo de distância (Haversine) feito no aparelho. A localização não é enviada ao backend.
- `src/context/FavoritesContext.js` e `src/context/VisitsContext.js`: persistência local com AsyncStorage.
- `src/hooks/usePlaces.js`: busca com debounce de 400 ms e recarga ao voltar ao primeiro plano.
- `src/i18n/`: português, inglês e espanhol, com detecção do idioma do aparelho.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o Metro bundler |
| `npm run android` | Abre no Android |
| `npm run ios` | Abre no iOS (ainda não validado em dispositivo) |
| `npm run web` | Abre a versão web |
| `npm run lint` | ESLint com a configuração do Expo |

## Build

Os perfis de build ficam em `eas.json` (`development`, `preview` e `production`). Exemplo de build para distribuição interna:

```bash
npx eas build --platform android --profile preview
```
