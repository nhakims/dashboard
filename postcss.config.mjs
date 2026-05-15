import { dirname } from "path";
import { fileURLToPath } from "url";

const config = {
  plugins: {
    "@tailwindcss/postcss": {
      base: dirname(fileURLToPath(import.meta.url)),
    },
  },
};

export default config;
