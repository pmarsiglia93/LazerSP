import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Backend usado pelo proxy de desenvolvimento. Padrão: backend local,
  // para que `npm run dev` nunca altere dados de produção sem intenção explícita.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:3001'

  return {
    plugins: [react()],
    base: '/admin/',
    build: {
      outDir: '../backend/public/admin',
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
