import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4321', // Assicurati che la porta sia corretta
    supportFile: false,
  },
});