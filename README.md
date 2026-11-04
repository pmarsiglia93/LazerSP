# LazerSP

[![CI](https://github.com/pmarsiglia93/LazerSP/actions/workflows/ci.yml/badge.svg)](https://github.com/pmarsiglia93/LazerSP/actions/workflows/ci.yml)

Guia móvel de lazer urbano para a cidade de São Paulo.

Projeto desenvolvido como Trabalho de Conclusão de Curso do **MBA em Engenharia de Software da USP/ESALQ**, aprovado com nota 10 em julho de 2026. Selecionado para o programa **Sebrae Startup Experience (ESX) 2026**.

## Sobre o projeto

O LazerSP centraliza informações sobre pontos de lazer, cultura, gastronomia e vida noturna em São Paulo, permitindo ao usuário descobrir lugares próximos com dados essenciais como localização, horário de funcionamento, preço e avaliação.

O repositório é um monorepo com três aplicações:

| Pasta | Aplicação | Stack |
|-------|-----------|-------|
| `LazerSP/` | App mobile | React Native 0.81 + Expo SDK 54 + React 19 |
| `backend/` | API REST | Node.js 22 + Express + SQLite (better-sqlite3) + JWT + zod |
| `admin/` | Painel administrativo | React 18 + Vite |

Infraestrutura: Docker + Docker Compose. Distribuído hoje como APK Android; a versão iOS ainda não foi validada em dispositivo.

---

## Funcionalidades

**App mobile**
- Listagem de lugares com busca por texto e tags
- 105 lugares em 11 categorias: parques, museus, centros culturais, teatros, cinemas, esportes, pontos turísticos, mercados, bares, restaurantes e baladas
- Filtro por categoria
- Filtro de locais gratuitos
- Ordenação por proximidade via geolocalização (fórmula de Haversine, calculada no aparelho)
- Status de aberto/fechado calculado pelo horário de funcionamento, com horários diferentes por dia, dois turnos, madrugada e fuso de São Paulo; teatros e cinemas aparecem como "Ver programação"
- Tela de detalhes com avaliação, horário e preço
- Botões "Como chegar" (Google Maps, pelo endereço), "Ir de Uber" e Instagram, com deep link para o app ou site
- Favoritos e registro de visitas salvos no aparelho (AsyncStorage)
- Login opcional com Google: sincroniza favoritos e visitas entre aparelhos
- Avaliações públicas da comunidade (nota de 1 a 5 e comentário), com média exibida em cada lugar
- Exclusão de conta pelo próprio app
- Mapa interativo com marcadores
- Interface em português, inglês e espanhol
- Atualização automática ao voltar ao primeiro plano

**Painel administrativo**
- Login com JWT (senha com hash bcrypt e limite de tentativas)
- Cadastro, edição e remoção de lugares
- Geocodificação de endereço via OpenStreetMap (Nominatim)
- Moderação de avaliações (ocultar, republicar e excluir)

---

## Pré-requisitos

- [Node.js v22](https://nodejs.org/)
- [nvm](https://github.com/nvm-sh/nvm) (recomendado para gerenciar versões do Node)
- [Expo Go](https://expo.dev/go) no celular para testar em dispositivo físico

---

## Como rodar localmente

### 1. Clone o repositório

```bash
git clone https://github.com/pmarsiglia93/LazerSP.git
cd LazerSP
```

### 2. Configure a versão do Node

```bash
nvm install 22
nvm use 22
```

### 3. Backend

```bash
cd backend
cp .env.example .env   # defina ADMIN_USER, a senha e JWT_SECRET (veja "Variáveis de ambiente")
npm install
npm run seed           # popula o banco com os 105 lugares (seed + lotes de dados)
npm run dev            # inicia em http://localhost:3001
```

### 4. App mobile

Em outro terminal:

```bash
cd LazerSP
cp .env.example .env   # ajuste o IP da sua máquina
npm install
npx expo start
```

Pressione `w` para abrir no navegador, ou escaneie o QR code com o **Expo Go** no celular (celular e computador devem estar na mesma rede Wi-Fi). Descubra seu IP com `hostname -I | awk '{print $1}'`.

### 5. Painel administrativo

Em outro terminal, com o backend rodando:

```bash
cd admin
npm install
npm run dev            # http://localhost:5173/admin
```

Por padrão o painel usa o backend local (`http://localhost:3001`). Para apontar para outro ambiente, defina `VITE_API_TARGET`.

---

## Como rodar com Docker

```bash
cp .env.example .env   # defina ADMIN_USER, a senha e JWT_SECRET
docker compose up --build
```

- App (versão web): [http://localhost:8081](http://localhost:8081)
- API: [http://localhost:3001](http://localhost:3001)

---

## Testes

```bash
cd backend && npm test      # 321 testes, 92% de cobertura de linhas
cd LazerSP && npm test      # 53 testes
```

**Backend** (Jest + Supertest, banco SQLite temporário populado pelo seed):
- cálculo de aberto/fechado, incluindo vários trechos, turnos, madrugada, fuso e regressão com os 105 lugares
- lote de dados: campos obrigatórios, coordenadas dentro do município e migração idempotente
- rotas públicas: filtros, busca, paginação, ordenação, 404 e headers de segurança
- login: hash bcrypt, compatibilidade com senha em texto puro, JWT e rate limit
- rotas de admin: autenticação, validação, transações e remoção em cascata
- login com Google (token simulado), sincronização de favoritos e visitas, exclusão de conta
- avaliações: criação, edição, média, nome público, moderação e limite de escrita
- tratamento de erros e validação das variáveis de ambiente

**Mobile** (jest-expo + React Native Testing Library): cálculo de distância, status, nota e horário dos lugares, link de rotas, resolução da URL da API, login e sessão (`AuthContext`), junção de favoritos e visitas com a conta, contexto de favoritos e o hook `usePlaces`.

O CI (GitHub Actions) roda os testes do backend e do mobile, o lint do mobile e o build do painel a cada push e pull request.

---

## Estrutura do projeto

```
LazerSP/
├── backend/                  # API REST
│   ├── src/
│   │   ├── app.js            # Configuração do Express
│   │   ├── server.js         # Entrada: inicia o servidor HTTP
│   │   ├── controllers/      # Lógica das rotas públicas e de admin
│   │   ├── routes/           # Definição de rotas
│   │   ├── database/         # Inicialização, migrations e seed
│   │   ├── middleware/       # Autenticação JWT, erros e 404
│   │   └── utils/            # Utilitários (ex: cálculo de aberto/fechado)
│   └── tests/                # Testes unitários e de integração
│
├── admin/                    # Painel administrativo (React + Vite)
│   └── src/
│       ├── pages/            # Login, lista e formulário de lugares
│       └── services/         # Comunicação com a API
│
└── LazerSP/                  # App React Native (Expo)
    ├── App.js                # Providers e ponto de entrada
    └── src/
        ├── screens/          # Telas do app
        ├── components/       # Componentes reutilizáveis
        ├── navigation/       # Configuração de rotas
        ├── hooks/            # Custom hooks
        ├── context/          # Contextos React (favoritos, localização, visitas)
        ├── i18n/             # Traduções (pt, en, es)
        ├── services/         # Comunicação com a API
        └── styles/           # Tema e design tokens
```

---

## Dados dos lugares

- `backend/src/database/seed.js`: 45 lugares iniciais, inseridos quando o banco está vazio.
- `backend/src/database/data/`: lotes adicionados depois (60 lugares em novembro de 2026), com a fonte de cada horário.
- `backend/src/database/dataMigrations.js`: aplica cada lote uma única vez por banco, na subida do servidor e no `npm run seed`. Lugares com nome já cadastrado são ignorados, e um lugar removido pelo painel não volta.

**Formato do horário de funcionamento** (trechos separados por `;`):

| Exemplo | Significado |
|---------|-------------|
| `06:00 - 22:00` | Todos os dias |
| `Ter-Dom 10:00 - 18:00` | Faixa de dias |
| `Ter-Sex 10:00 - 21:30; Sáb-Dom 10:00 - 18:30` | Horários diferentes por dia |
| `Seg 10:00 - 18:00; Qua-Sex 10:00 - 18:00` | Dias isolados |
| `Seg-Dom 12:00 - 16:00, 18:30 - 00:00` | Dois turnos |
| `Sex-Sáb 23:00 - 05:00` | Vira a madrugada |
| `Aberto 24 horas` | Sempre aberto |
| `Conforme programação` | Sem horário fixo (status "Ver programação") |

---

## Endpoints da API

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| GET | `/` | Não | Health check |
| GET | `/api/places` | Não | Lista lugares com filtros |
| GET | `/api/places/:id` | Não | Detalhes de um lugar |
| GET | `/api/places/categories` | Não | Lista de categorias |
| POST | `/api/auth/login` | Não | Login do painel; retorna um JWT válido por 24h |
| POST | `/api/admin/places` | JWT | Cria um lugar |
| PUT | `/api/admin/places/:id` | JWT | Atualiza um lugar |
| DELETE | `/api/admin/places/:id` | JWT | Remove um lugar |
| GET | `/api/admin/reviews` | JWT | Lista avaliações para moderação (`?status=published\|hidden`) |
| PATCH | `/api/admin/reviews/:id` | JWT | Oculta ou republica uma avaliação |
| DELETE | `/api/admin/reviews/:id` | JWT | Exclui uma avaliação |
| POST | `/api/auth/google` | Não | Login do app com o ID token do Google; retorna um token de usuário válido por 30 dias |
| GET | `/api/me` | Usuário | Perfil do usuário logado |
| DELETE | `/api/me` | Usuário | Exclui a conta com favoritos, visitas e avaliações |
| GET, PUT | `/api/me/favorites` | Usuário | Lê ou substitui a lista de favoritos |
| PUT, DELETE | `/api/me/favorites/:placeId` | Usuário | Adiciona ou remove um favorito |
| GET, PUT | `/api/me/visits` | Usuário | Lê ou substitui as visitas |
| PUT, DELETE | `/api/me/visits/:placeId` | Usuário | Salva ou remove uma visita |
| GET | `/api/places/:id/reviews` | Opcional | Avaliações publicadas, média e a avaliação do próprio usuário |
| PUT, DELETE | `/api/places/:id/reviews` | Usuário | Cria, edita ou remove a própria avaliação (até 20 por hora) |

Rotas com JWT ou Usuário exigem o header `Authorization: Bearer <token>`. Tokens de usuário não acessam rotas de admin, e vice-versa.

**Parâmetros de `/api/places`:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `search` | string | Busca por nome, categoria, endereço, descrição, destaque ou tag |
| `category` | string | Filtra por categoria |
| `free` | boolean | `true` para mostrar apenas locais gratuitos |
| `limit` | number | Máximo de resultados (padrão: 50, máximo: 200) |
| `offset` | number | Paginação (padrão: 0) |

---

## Variáveis de ambiente

**Backend (`backend/.env`)**

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `PORT` | Não | Porta HTTP (padrão: 3001 no `.env.example`) |
| `NODE_ENV` | Não | `development` ou `production` |
| `DB_PATH` | Não | Caminho do arquivo SQLite |
| `ALLOWED_ORIGINS` | Em produção | Origens liberadas no CORS, separadas por vírgula |
| `ADMIN_USER` | Sim, para o painel | Usuário do painel administrativo |
| `ADMIN_PASSWORD_HASH` | Sim, para o painel | Hash bcrypt da senha. Gere com `npm run hash-password -- "sua-senha"` |
| `ADMIN_PASSWORD` | Não | Senha em texto puro; aceita por compatibilidade quando não há hash, com aviso no log |
| `JWT_SECRET` | Sim, para o painel | Segredo de assinatura do JWT (mínimo de 32 caracteres aleatórios) |
| `TRUST_PROXY` | Não | Saltos de proxy confiáveis para identificar o IP do cliente (padrão: 1 em produção) |
| `API_RATE_LIMIT` | Não | Requisições por IP a cada 15 minutos na API (padrão: 1000) |
| `GOOGLE_CLIENT_IDS` | Sim, para o login do app | Client IDs OAuth do Google aceitos (web, Android e iOS), separados por vírgula |

Sem a configuração do painel, a API pública continua funcionando e o login responde 503. Os problemas de configuração aparecem no log na subida do servidor.

**App mobile (`LazerSP/.env`)**

| Variável | Descrição |
|----------|-----------|
| `EXPO_PUBLIC_API_URL` | URL base da API, ex: `http://SEU_IP_LOCAL:3001/api`. Nos builds do EAS vem do `eas.json`; sem ela, builds de release usam a API de produção em HTTPS |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Client ID OAuth do tipo Web; sem ele, o login com Google fica oculto |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Client ID OAuth do tipo iOS (só para builds iOS) |
| `GOOGLE_IOS_URL_SCHEME` | Client ID iOS invertido (`com.googleusercontent.apps...`), usado no build iOS |

O login com Google usa um módulo nativo: funciona em development builds e builds do EAS, mas não no Expo Go nem na versão web.


**Painel administrativo (opcional)**

| Variável | Descrição |
|----------|-----------|
| `VITE_API_TARGET` | Backend usado pelo proxy de desenvolvimento (padrão: `http://localhost:3001`) |

---

## Limitações conhecidas

- O painel administrativo ainda não tem testes automatizados.
- Para publicar na App Store com login do Google, a Apple exige também uma opção equivalente (como Sign in with Apple), ainda não implementada.
- A versão iOS não foi validada em dispositivo.
- A ordenação por proximidade é feita no aparelho sobre a página retornada pela API (até 50 lugares por padrão).

---

## Autor

**Paulo Francisco Marsiglia**, Bacharel em Lazer e Turismo (EACH-USP) e desenvolvedor Full Stack.

Orientador: Prof. Dr. Alexandre Leite Rangel.
