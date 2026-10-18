# Panificadora Wollner — site + painel administrativo

Site institucional e vitrine de encomendas da Panificadora Wollner (Joinville-SC).
Feito com **Vue 3 + Vite + JavaScript + Vue Router** (Composition API, `<script setup>`).
Hospedagem na **Vercel**; as edições do painel ficam salvas no **Vercel Blob** (armazenamento de arquivos, sem banco de dados tradicional).

---

## 1. Como funciona (resumo)

| Parte | Onde | O que faz |
|---|---|---|
| Site público | `src/views`, `src/components` | Início, Encomendas (catálogo), Sobre, Localização e contato |
| Painel | `/admin` | Login, produtos, categorias, página inicial/slides, institucional, contato, mensagens do WhatsApp |
| API | `api/` (Vercel Functions) | `/api/content` (público) e `/api/admin/*` (protegido por login) |
| Dados | Vercel Blob | `data/site.json` (conteúdo) e `uploads/…` (fotos) |
| Config central | `shared/defaultContent.js` | Valores iniciais: WhatsApp, endereço, mensagens, categorias |

Tudo que o painel altera é gravado no Blob, então **continua lá depois de atualizar a página ou fechar o navegador**.
O WhatsApp **nunca é enviado sozinho**: o site só abre a conversa com a mensagem pronta e o cliente aperta enviar.

---

## 2. Instalar

Requisitos: **Node.js 18.18+** (recomendado 20 ou 22) e npm.

```bash
cd Panificadora-Wollner
npm install
```

## 3. Rodar no VS Code (local)

1. Abra a pasta no VS Code (`File > Open Folder`).
2. Abra o terminal integrado (`Ctrl + '`).
3. Crie o arquivo `.env.local` (copie o `.env.example`) e preencha o painel (veja a seção 4).
4. Rode:

```bash
npm run dev
```

Acesse `http://localhost:5173`. O painel fica em `http://localhost:5173/admin`.

No modo local **não precisa de Blob**: as edições são salvas em arquivos na pasta `.data/` (ignorada pelo Git).
Isso serve só para testar; o site publicado usa o Blob.

Outros comandos:

```bash
npm run build        # gera a versão de produção em dist/
npm run preview      # serve o dist/ para conferir (sem a API)
npm run test:api     # testes automáticos da API e das regras de mensagem/preço
npm run hash-password -- "sua-senha"   # gera as variáveis de login
```

## 4. Variáveis de ambiente (login do painel)

Não existe senha no código. Você gera um *hash* e guarda nas variáveis de ambiente.

```bash
npm run hash-password -- "uma-senha-forte-com-12-ou-mais-caracteres"
```

O comando imprime duas linhas:

```
ADMIN_PASSWORD_HASH=scrypt:...
SESSION_SECRET=...
```

| Variável | Para que serve |
|---|---|
| `ADMIN_USER` | Nome de usuário do painel (você escolhe) |
| `ADMIN_PASSWORD_HASH` | Hash da senha (saída do comando acima) |
| `SESSION_SECRET` | Texto aleatório que assina o cookie de sessão (mesma saída) |
| `BLOB_READ_WRITE_TOKEN` | Criado **automaticamente** pela Vercel ao conectar o Blob ao projeto |

Local: coloque em `.env.local` (não vai para o Git nem para o ZIP).
Produção: cadastre na Vercel em *Project > Settings > Environment Variables*.
Sem essas variáveis, o painel mostra "não configurado" e **não deixa salvar** (de propósito).

## 5. Publicar na Vercel

1. Suba o projeto para um repositório no GitHub (o `.gitignore` já protege `.env*`, `node_modules`, `.data`).
2. Em [vercel.com](https://vercel.com) > **Add New > Project**, importe o repositório. O `vercel.json` já define o framework (Vite) e a pasta `dist`.
3. **Crie o Blob**: no projeto, aba **Storage > Create > Blob**.
   - Escolha acesso **Public** (as fotos e o `site.json` precisam ser públicos para o site ler). **Não dá para mudar depois de criado.**
   - Conecte a loja ao projeto (todos os ambientes). A Vercel cria `BLOB_READ_WRITE_TOKEN` sozinha.
4. Em **Settings > Environment Variables**, adicione `ADMIN_USER`, `ADMIN_PASSWORD_HASH` e `SESSION_SECRET`.
5. Faça o **Deploy** (ou *Redeploy* se as variáveis foram criadas depois).
6. Abra `https://SEU-PROJETO.vercel.app/admin`, entre e confira se aparece "Armazenamento: Vercel Blob".

O endereço `.vercel.app` é HTTPS e estável. Para domínio próprio: *Settings > Domains*.

## 6. Atualizar o site depois

- **Conteúdo (produtos, fotos, textos, preços, mensagens, contato):** pelo painel `/admin`, sem mexer em código. Clique em **Salvar alterações**.
  Visitantes podem levar **1 a 2 minutos** para ver a mudança (cache da CDN).
- **Código ou design:** altere os arquivos, faça `git push`; a Vercel publica sozinha.
- Fotos enviadas e depois não salvas (você fechou sem salvar) ficam órfãs no Blob; ocupam pouco espaço, e dá para apagá-las pelo painel da Vercel.

## 7. Como testar

Checklist rápido depois de publicar:

- [ ] Navegar por Início, Encomendas, Sobre, Contato (menu e menu mobile)
- [ ] Filtrar por categoria e buscar por nome; categoria vazia mostra aviso
- [ ] Produto "Preço sob consulta" / "A combinar" nunca mostra R$ 0,00
- [ ] Botão de encomenda abre o WhatsApp com a mensagem do produto
- [ ] Botão flutuante aparece nas páginas públicas e **não** no painel
- [ ] Mapa carrega; "Como chegar" abre rota no Google Maps
- [ ] Login errado é recusado; login certo entra
- [ ] Criar produto + enviar foto + salvar; **recarregar** e **abrir em outro navegador**: continua lá
- [ ] Editar mensagem e ver a prévia
- [ ] Informar o ano de fundação em Institucional e ver os "anos de atividade"

Testes automáticos: `npm run test:api`.

## 8. Gerar QR Code

Depois de ter a URL final (ex.: `https://wollner.vercel.app`), gere o QR em qualquer gerador gratuito
(por exemplo, procure "gerador de QR code" e cole a URL). Use a URL `/encomendas` se quiser levar direto ao catálogo.
Baixe em PNG/SVG de alta resolução para impressão.

---

## 9. Avisos importantes

**Plano da Vercel.** O plano **Hobby é só para uso não comercial**. Como este site é de uma empresa, a produção deve rodar em um plano **Pro** (ou outro host que aceite uso comercial). Para testes e demonstração, o Hobby serve.

**Limites do Vercel Blob no Hobby:** 1 GB de armazenamento, 10.000 operações simples e 2.000 avançadas por mês (cada salvamento ou upload conta uma avançada), 10 GB de transferência. Passar do limite bloqueia o Blob por 30 dias. Para uma padaria, o uso normal fica bem abaixo, mas confira os valores atuais na documentação da Vercel.

**Fotos de exemplo.** As imagens em `public/images/seed/` são recortes de baixa resolução do Instagram, usadas só como espaço reservado. Troque por fotos reais pelo painel.

**Nada inventado.** Horário de funcionamento, ano de fundação, história, Facebook e preços começam **vazios** e são editáveis pelo painel. Preencha com dados reais.

**Segurança.** Senha só como hash em variável de ambiente; cookie de sessão HttpOnly assinado; proteção CSRF; limite de tentativas de login (melhor esforço em ambiente serverless). Use uma senha forte.

## 10. Estrutura

```
api/            Funções serverless (content, admin) e libs (auth, storage, sanitize)
shared/         Código usado por site e API (mensagens WhatsApp, preço, empresa, conteúdo padrão)
src/views/      Uma página por arquivo (Home, Encomendas, Sobre, Contato, Admin)
src/components/ Componentes reutilizáveis (+ components/admin)
src/assets/styles/  global.css e admin.css
src/stores/     Estado (conteúdo, pedido, admin)
scripts/        hash-password e testes da API
```
