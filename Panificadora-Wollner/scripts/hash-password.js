// Uso: npm run hash-password -- "sua-senha"
// Gera o valor para ADMIN_PASSWORD_HASH. A senha em si nunca fica salva em arquivo.
import crypto from 'node:crypto'
import { hashPassword } from '../api/_lib/auth.js'

const password = process.argv[2]

if (!password || password.length < 10) {
  console.error('Informe uma senha com pelo menos 10 caracteres:\n  npm run hash-password -- "sua-senha-aqui"')
  process.exit(1)
}

console.log('\nCopie estas linhas para o .env.local (e para as variáveis da Vercel):\n')
console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`)
console.log(`SESSION_SECRET=${crypto.randomBytes(32).toString('base64url')}`)
console.log('\nDefina também ADMIN_USER (o nome de usuário que você quiser).\n')
