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
- Filtro por categoria (Parques, Museus, Bares, Restaurantes, Baladas...)
- Filtro de locais gratuitos
- Ordenação por proximidade via geolocalização (fórmula de Haversine, calculada no aparelho)
- Status de aberto/fechado calculado pelo horário de funcionamento, incluindo horários que viram a madrugada, sempre no fuso de São Paulo
- Tela de detalhes com avaliação, horário e preço
- Botões "Como chegar" (Google Maps), "Ir de Uber" e Instagram, com deep link para o app ou site
- Favoritos e registro de visitas com persistência local (AsyncStorage)
- Mapa interativo com marcadores
- Interface em português, inglês e espanhol
- Atualização automática ao voltar ao primeiro plano

**Painel administrativo**
- Login com JWT (senha com hash bcrypt e limite de tentativas)
- Cadastro, edição e remoção de lugares
- Geocodificação de endereço via OpenStreetMap (Nominatim)

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
npm run seed           # popula o banco com os 45 lugares iniciais
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
cd backend && npm test      # 144 testes, 95% de cobertura de linhas
cd LazerSP && npm test      # 20 testes
```

**Backend** (Jest + Supertest, banco SQLite temporário populado pelo seed):
- cálculo de aberto/fechado, incluindo madrugada, meia-noite, fuso e regressão com os 45 lugares
- rotas públicas: filtros, busca, paginação, ordenação, 404 e headers de segurança
- login: hash bcrypt, compatibilidade com senha em texto puro, JWT e rate limit
- rotas de admin: autenticação, validação, transações e remoção em cascata
- tratamento de erros e validação das variáveis de ambiente

**Mobile** (jest-expo + React Native Testing Library): cálculo de distância, resolução da URL da API, contexto de favoritos e o hook `usePlaces` (filtros, debounce, ordenação e erro).

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

Rotas com JWT exigem o header `Authorization: Bearer <token>`.

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

Sem a configuração do painel, a API pública continua funcionando e o login responde 503. Os problemas de configuração aparecem no log na subida do servidor.

**App mobile (`LazerSP/.env`)**

| Variável | Descrição |
|----------|-----------|
| `EXPO_PUBLIC_API_URL` | URL base da API, ex: `http://SEU_IP_LOCAL:3001/api`. Nos builds do EAS vem do `eas.json`; sem ela, builds de release usam a API de produção em HTTPS |

**Painel administrativo (opcional)**

| Variável | Descrição |
|----------|-----------|
| `VITE_API_TARGET` | Backend usado pelo proxy de desenvolvimento (padrão: `http://localhost:3001`) |

---

## Limitações conhecidas

- O painel administrativo ainda não tem testes automatizados.
- A versão iOS não foi validada em dispositivo.
- A ordenação por proximidade é feita no aparelho sobre a página retornada pela API (até 50 lugares por padrão).

---

## Autor

**Paulo Francisco Marsiglia**, Bacharel em Lazer e Turismo (EACH-USP) e desenvolvedor Full Stack.

Orientador: Prof. Dr. Alexandre Leite Rangel.
