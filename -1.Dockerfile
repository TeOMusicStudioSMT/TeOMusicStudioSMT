# Stage 1: Build the React frontend
FROM node:20.10.0-alpine AS frontend-builder
WORKDIR /usr/src/app

# Kopiowanie plików pakietu i instalacja zależności
COPY package*.json ./
RUN npm install

# Kopiowanie reszty kodu front-endu
COPY . .

# Uruchomienie kompilacji
RUN npm run build

# Stage 2: Finalny obraz produkcyjny
FROM nginx:alpine
COPY --from=frontend-builder /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]