# Stage 1: Build (Vite)
FROM node:20-alpine AS builder
WORKDIR /app

# Kopiujemy definicje zależności
COPY package*.json ./

# Instalujemy zależności (bez sprawdzania wersji, dla pewności)
RUN npm install --legacy-peer-deps

# Kopiujemy resztę kodu
COPY . .

# Budujemy aplikację
RUN npm run build

# Stage 2: Serwowanie (Nginx)
FROM nginx:alpine
# Vite domyślnie buduje do folderu 'dist'
COPY --from=builder /app/dist /usr/share/nginx/html
# Dodajemy konfigurację dla SPA (żeby odświeżanie strony nie dawało 404)
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]