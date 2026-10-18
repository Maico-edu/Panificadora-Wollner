import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// Em desenvolvimento, as funções da pasta api/ rodam dentro do próprio Vite
// (um único comando: npm run dev). Na Vercel elas rodam como funções normais.
function localApi(env) {
  return {
    name: 'wollner-local-api',
    configureServer(server) {
      Object.assign(process.env, env)

      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url, 'http://localhost').pathname
        try {
          if (pathname === '/api/content') {
            const mod = await server.ssrLoadModule('/api/content.js')
            return await mod.default(req, res)
          }
          if (pathname.startsWith('/api/admin')) {
            const mod = await server.ssrLoadModule('/api/admin.js')
            return await mod.default(req, res)
          }
          if (pathname.startsWith('/uploads/')) {
            const storage = await server.ssrLoadModule('/api/_lib/storage.js')
            const file = await storage.readLocalUpload(decodeURIComponent(pathname))
            if (!file) {
              res.statusCode = 404
              return res.end('Not found')
            }
            const type = pathname.endsWith('.png') ? 'image/png' : pathname.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
            res.setHeader('Content-Type', type)
            return res.end(file)
          }
        } catch (error) {
          console.error(error)
          res.statusCode = 500
          return res.end('Erro no servidor local')
        }
        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue(), localApi(env)],
    server: { port: 5173 },
  }
})
