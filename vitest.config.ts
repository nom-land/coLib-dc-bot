import { defineConfig } from "vite";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        testTimeout: 50000,
    },
});
