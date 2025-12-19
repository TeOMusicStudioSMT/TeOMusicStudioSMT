import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: true, // <--- TO JEST KLUCZ! Pozwalamy na każdy host w chmurze
    host: true,         // <--- Nasłuchuj na wszystkich adresach
    port: 8080,         // <--- Upewniamy się, że port jest zgodny
  },
})