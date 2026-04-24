# syntax=docker/dockerfile:1.5
FROM node:20-alpine AS base

WORKDIR /app

COPY app ./app
COPY server.mjs ./server.mjs

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.mjs"]
