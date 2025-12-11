# Stage 1: Build Environment
FROM node:20-alpine AS builder
WORKDIR /app

# GORGOO FIX: Kopiujemy package.json z podkatalogu 'frontend'
COPY frontend/package*.json ./

# Instalujemy zależności (z legacy-peer-deps, bo pewnie są stare pakiety)
RUN npm install --legacy-peer-deps

# GORGOO FIX: Kopiujemy CAŁĄ zawartość folderu 'frontend'
COPY frontend/ .

# --- GORGOO HOTFIX START ---
RUN npm install ajv@^8 --save-dev
# --- GORGOO HOTFIX END ---

# --- GORGOO DEBUG: Pokaż mi listę plików w src ---
RUN echo "--- ZAWARTOŚĆ KATALOGU SRC ---"
RUN ls -la /app/src
# ---------------------------------------------

# Budujemy aplikację
RUN npm run build

# Stage 2: Production Server (Nginx)
FROM nginx:alpine

# Kopiujemy zbudowane pliki
COPY --from=builder /app/build /usr/share/nginx/html

# Konfiguracja Nginx (bez zmian, jest poprawna)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]