# LazerSP

Guia móvel de lazer urbano para a cidade de São Paulo. Aplicativo desenvolvido como Trabalho de Conclusão de Curso (TCC) em Lazer e Turismo — Fatec Bebedouro.

## Sobre o projeto

O LazerSP centraliza informações sobre pontos de lazer, cultura, gastronomia e vida noturna em São Paulo, permitindo ao usuário descobrir lugares próximos com dados essenciais como localização, horário de funcionamento, preço e avaliação.

**Stack:**
- **Frontend:** React Native com Expo (Android, iOS e Web)
- **Backend:** Node.js + Express
- **Banco de dados:** SQLite via better-sqlite3
- **Infraestrutura:** Docker + Docker Compose

---

## Funcionalidades

- Listagem de lugares com busca por texto e tags
- Filtro por categoria (Parques, Museus, Bares, Restaurantes, Baladas...)
- Filtro de locais gratuitos
- Ordenação por proximidade via geolocalização (fórmula de Haversine)
- Status de aberto/fechado calculado em tempo real pelo horário de funcionamento
- Tela de detalhes com avaliação, horário e preço
- Botão "Como chegar" (Google Maps)
- Botão "Ir de Uber" (deep link para o app ou site)
- Favoritos com persistência local (AsyncStorage)
- Mapa interativo com marcadores
- Atualização automática ao voltar ao primeiro plano

---

## Pré-requisitos

- [Node.js v20](https://nodejs.org/)
- [nvm](https://github.com/nvm-sh/nvm) (recomendado para gerenciar versões do Node)
- [Expo Go](https://expo.dev/go) no celular para testar em dispositivo físico

---

## Como rodar localmente

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd LazerSP-Projeto
```

### 2. Configure a versão do Node

```bash
nvm install 20
nvm use 20
```

### 3. Backend

```bash
cd backend
cp .env.example .env   # ajuste as variáveis se necessário
npm install
npm run seed           # popula o banco com os 45 lugares iniciais
npm run dev            # inicia em http://localhost:3001
```

### 4. Frontend

Em outro terminal:

```bash
cd LazerSP
npm install
npx expo start
```

Pressione `w` para abrir no navegador, ou escaneie o QR code com o **Expo Go** no celular (celular e computador devem estar na mesma rede Wi-Fi).

> **Celular físico:** atualize o IP em `LazerSP/.env`:
> ```
> EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3001/api
> ```
> Descubra seu IP com: `hostname -I | awk '{print $1}'`

---

## Como rodar com Docker

```bash
docker-compose up --build
```

- Frontend: [http://localhost:8081](http://localhost:8081)
- Backend: [http://localhost:3001](http://localhost:3001)

---

## Testes

```bash
cd backend
npm test
```

24 testes automatizados cobrindo:
- Utilitário de cálculo de horário (`isOpenNow`)
- Rotas da API REST (estrutura, validação, códigos HTTP)

---

## Estrutura do projeto

```
LazerSP-Projeto/
├── backend/                  # API REST
│   ├── src/
│   │   ├── app.js            # Configuração do Express
│   │   ├── server.js         # Entrada — inicia o servidor HTTP
│   │   ├── controllers/      # Lógica de negócio
│   │   ├── routes/           # Definição de rotas
│   │   ├── database/         # Inicialização, migrations e seed
│   │   ├── middleware/        # Tratamento de erros e 404
│   │   └── utils/            # Utilitários (ex: cálculo is_open)
│   └── tests/                # Testes unitários e de integração
│
└── LazerSP/                  # App React Native (Expo)
    ├── App.js                # Providers e ponto de entrada
    └── src/
        ├── screens/          # Telas do app
        ├── components/       # Componentes reutilizáveis
        ├── navigation/       # Configuração de rotas
        ├── hooks/            # Custom hooks
        ├── context/          # Contextos React (favoritos, localização)
        ├── services/         # Comunicação com a API
        └── styles/           # Tema e design tokens
```

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Health check |
| GET | `/api/places` | Lista lugares com filtros |
| GET | `/api/places/:id` | Detalhes de um lugar |
| GET | `/api/places/categories` | Lista de categorias |

**Parâmetros de `/api/places`:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `search` | string | Busca por nome, endereço, descrição ou tag |
| `category` | string | Filtra por categoria |
| `free` | boolean | `true` para mostrar apenas locais gratuitos |
| `limit` | number | Máximo de resultados (padrão: 50, máximo: 200) |
| `offset` | number | Paginação (padrão: 0) |

---

## Variáveis de ambiente

**Backend (`backend/.env`):**

```
PORT=3001
NODE_ENV=development
DB_PATH=./lazersp.db
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

**Frontend (`LazerSP/.env`):**

```
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Autor

Paulo Francisco Marsiglia — Bacharel em Lazer e Turismo, Desenvolvedor de Software.
Orientador: Prof. Alexandre L. Rangel — Fatec Bebedouro.
