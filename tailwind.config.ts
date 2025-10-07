import type { Config } from "tailwindcss"

export default {
  content: [
    "./src/**/*.{ts,tsx}", // ← src配下の全てのtsxファイルを対象
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
