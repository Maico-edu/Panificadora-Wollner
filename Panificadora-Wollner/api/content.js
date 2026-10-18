// GET /api/content  → conteúdo público do site (cacheado na CDN por 1 minuto).
import { readContent } from './_lib/storage.js'
import { sendError, sendJson } from './_lib/http.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendError(res, 405, 'Método não permitido.')
  try {
    const content = await readContent()
    sendJson(res, 200, content, {
      // Navegador: sempre confere se há versão nova. CDN da Vercel: guarda por 60 s
      // (e serve a cópia antiga por até 5 min enquanto atualiza em segundo plano).
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Vercel-CDN-Cache-Control': 'max-age=60, stale-while-revalidate=300',
    })
  } catch (error) {
    console.error('Falha ao ler conteúdo:', error)
    sendError(res, 500, 'Não foi possível carregar o conteúdo.')
  }
}
