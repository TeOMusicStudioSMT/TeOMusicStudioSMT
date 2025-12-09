# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Kopiujemy pliki konfiguracyjne
COPY package.json ./

# GORGOO: Usuwamy package-lock.json z równania, bo może powodować błędy JSON
# Instalujemy zależności z flagą legacy-peer-deps dla bezpieczeństwa
RUN npm install --legacy-peer-deps

# Kopiujemy resztę projektu
COPY . .

# Budujemy aplikację (React Scripts tworzy folder 'build')
RUN npm run build

# Stage 2: Serwowanie (Nginx)
FROM nginx:alpine

# GORGOO FIX: Kopiujemy z folderu 'build' (nie dist!), bo używasz react-scripts
COPY --from=builder /app/build /usr/share/nginx/html

# Konfiguracja Nginx dla React Router (zapobiega błędom 404 przy odświeżaniu)
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