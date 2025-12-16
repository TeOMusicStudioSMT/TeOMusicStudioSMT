# Stage 1: Budowanie Aplikacji (Vite)
FROM node:20-alpine AS builder
WORKDIR /app

# Kopiujemy pliki zależności
COPY package.json package-lock.json ./

# Instalujemy zależności
RUN npm install

# Kopiujemy resztę kodu
COPY . .

# Budujemy (Vite tworzy folder 'dist')
RUN npm run build

# Stage 2: Serwer Produkcyjny (Nginx)
FROM nginx:alpine

# Kopiujemy zbudowaną aplikację
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiujemy konfigurację Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]