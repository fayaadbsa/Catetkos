FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3005 HOST=0.0.0.0 DB_PATH=/app/data/catetkos.db
COPY package.json ./
COPY server ./server
COPY --from=build /app/dist ./dist
COPY --from=build /app/seed/example ./seed/example
COPY scripts ./scripts
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 3005
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3005/api/status || exit 1
CMD ["node", "server/index.js"]
