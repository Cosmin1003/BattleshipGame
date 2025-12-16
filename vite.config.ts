// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Asigură-te că importăm 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Adăugăm configuratia pentru a rezolva problema celor doua instanțe React
  resolve: {
    alias: {
      // Forțează toate pachetele să folosească aceeași instanță de React
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
});