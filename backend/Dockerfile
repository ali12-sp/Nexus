FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci --ignore-scripts

COPY backend ./backend

WORKDIR /app/backend

RUN npm run prisma:generate
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
