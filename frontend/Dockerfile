FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci --ignore-scripts

COPY frontend ./frontend

WORKDIR /app/frontend

ENV NEXT_IGNORE_INCORRECT_LOCKFILE=1

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
