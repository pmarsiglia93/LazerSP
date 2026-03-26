# Frontend Expo — versão web (desenvolvimento)
FROM node:20-alpine

RUN apk add --no-cache git

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

EXPOSE 8081 19000 19001

CMD ["npx", "expo", "start", "--web", "--non-interactive", "--port", "8081"]
