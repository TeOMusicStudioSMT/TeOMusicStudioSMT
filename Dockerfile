# Wybieramy lekką wersję Node.js jako fundament
FROM node:20-alpine

# Ustawiamy katalog roboczy w kontenerze
WORKDIR /app

# Kopiujemy pliki definicji projektu
COPY package*.json ./

# Instalujemy WSZYSTKIE zależności (Vite, React, Firebase itd.)
RUN npm install

# Kopiujemy resztę kodu aplikacji
COPY . .

# Budujemy wersję produkcyjną
RUN npm run build

# Informujemy, że ten kontener używa portu 8080
EXPOSE 8080

# Uruchamiamy naszą naprawioną komendę "start"
CMD ["npm", "run", "start"]