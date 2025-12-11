# Stage 1: Build Environment
FROM node:20-alpine AS builder
WORKDIR /app

# GORGOO FIX: Kopiujemy package.json z podkatalogu 'frontend'
# Dockerfile leży w root, ale aplikacja jest w 'frontend/'
COPY frontend/package*.json ./

# Instalujemy zależności
RUN npm install --legacy-peer-deps

# GORGOO FIX: Kopiujemy CAŁĄ zawartość folderu 'frontend' do głównego katalogu roboczego kontenera (/app)
# Dzięki temu struktura plików w kontenerze będzie płaska (src i public będą bezpośrednio w /app)
COPY frontend/ .

# Budujemy aplikację (teraz znajdzie public/index.html)
RUN npm run build

# Stage 2: Production Server (Nginx)
FROM nginx:alpine

# Kopiujemy zbudowane pliki z folderu 'build' (React Scripts)
COPY --from=builder /app/build /usr/share/nginx/html

# Konfiguracja Nginx dla Single Page Application (zapobiega błędom 404 przy odświeżaniu)
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