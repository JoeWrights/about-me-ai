import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rsbuild/core";

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    title: "About Me AI",
  },
  source: {
    entry: {
      index: "./src/main.tsx",
    },
  },
});
