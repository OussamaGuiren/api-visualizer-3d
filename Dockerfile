# ---- Étape de build ----
FROM node:22.12.0-alpine AS builder

# Dossier de travail dans le container
WORKDIR /app

# On copie d'abord les fichiers de dépendances
COPY package*.json ./

# Install des dépendances (env de build)
RUN npm install

# On copie le reste du projet
COPY . .

# Build Nuxt (génère .output)
RUN npm run build

# ---- Étape de run ----
FROM node:22.12.0-alpine AS runner

WORKDIR /app

# On copie les fichiers nécessaires pour le run
COPY package*.json ./
COPY --from=builder /app/.output ./.output

# Install uniquement les dépendances nécessaires au runtime
RUN npm install --omit=dev

# Nuxt/Nitro écoute sur PORT
ENV NITRO_PORT=3000
ENV PORT=3000

EXPOSE 3000

# Commande de démarrage de Nuxt 4
CMD ["node", ".output/server/index.mjs"]
