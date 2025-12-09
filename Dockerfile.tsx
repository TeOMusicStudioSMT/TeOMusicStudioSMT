# Stage 1: Build the React frontend (Vite)
FROM node:20.10.0-alpine AS frontend-builder
WORKDIR /usr/src/app

# Kopiowanie plików pakietu i instalacja zależności
COPY package*.json ./
RUN npm install

# Kopiowanie reszty kodu
COPY . .

# Uruchomienie kompilacji
RUN npm run build

# Stage 2: Finalny obraz produkcyjny (Nginx)
FROM nginx:alpine

# GORGOO FIX: Vite buduje do folderu 'dist', nie 'build'
COPY --from=frontend-builder /usr/src/app/dist /usr/share/nginx/html

# Opcjonalnie: Konfiguracja dla React Router (SPA)
# Jeśli odświeżanie strony wyrzuca 404, będziemy musieli dodać nginx.conf
# Na razie zostawiamy standard.

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]