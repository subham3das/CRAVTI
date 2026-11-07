import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NEXT_PUBLIC_WEBSITE_URL': JSON.stringify(
      process.env.NEXT_PUBLIC_WEBSITE_URL || process.env.VITE_PUBLIC_WEBSITE_URL || 'https://craviti.com'
    ),
  },
})

