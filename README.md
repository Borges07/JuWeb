# Sistema de Votação de Destaque do Jogo ⚽

Aplicação web para votação do **destaque da partida** de um time de futebol.
O torcedor vota rapidamente, **sem precisar criar conta**, e há proteção contra
votos múltiplos. Há também uma área administrativa protegida para gerenciar
jogadores e o andamento da votação.

## Stack

- **Frontend:** React + Vite + TypeScript + React Router + Context API
- **Backend (BaaS):** Firebase Authentication + Firestore
- **Deploy:** Vercel (frontend) + Firebase (banco/auth)
- **Anti-voto-duplo:** Fingerprint do navegador + flag no LocalStorage (2 camadas)

> O PDF original especificava JavaScript (`.jsx`). Como o projeto já estava
> montado em **TypeScript**, mantivemos TS — a estrutura de pastas é a mesma.

## Estrutura de pastas

```
src/
  components/        # PlayerCard, VoteButton, RankingCard, Loading, ProtectedRoute
  pages/             # Home, Vote, Results, Login, Admin
  services/
    firebase/        # config.ts (inicialização do Firebase)
    playerService.ts # CRUD de jogadores
    voteService.ts   # registrar/apurar votos
    authService.ts   # login/logout admin
    settingsService.ts
  contexts/          # AuthContext
  hooks/             # useAuth, useVote, usePlayers
  routes/            # definição das rotas
  utils/             # fingerprint, validators
  constants/         # rotas e nomes de coleções
  types/             # tipos do domínio (Player, Vote, Settings)
```

## Como rodar localmente

```bash
npm install
cp .env.example .env.local   # depois preencha as credenciais do Firebase
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

### Scripts

| Comando         | O que faz                              |
| --------------- | -------------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento (HMR)      |
| `npm run build` | Type-check + build de produção (`dist`)|
| `npm run preview` | Pré-visualiza o build                |
| `npm run lint`  | ESLint                                 |

## Configuração do Firebase

> ⚠️ Ainda não configurado — a estrutura está pronta, falta criar o projeto e
> preencher as credenciais.

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Em **Firestore Database**, crie o banco (modo produção).
3. Em **Authentication**, ative o provedor **E-mail/senha** e cadastre o
   usuário do administrador (e-mail + senha).
4. Em **Configurações do projeto > Seus apps**, registre um app **Web** e copie
   as credenciais para o `.env.local`:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

5. Publique as regras de segurança do arquivo [`firestore.rules`](firestore.rules):
   - Pelo console: cole o conteúdo em **Firestore > Regras**, ou
   - Pela CLI: `npm i -g firebase-tools && firebase deploy --only firestore:rules`

### Coleções do Firestore

| Coleção    | Campos                                          |
| ---------- | ----------------------------------------------- |
| `players`  | `name`, `number`, `category?`, `photo?` (data URL base64), `active` |
| `votes`    | `playerId`, `fingerprint`, `createdAt`          |
| `settings` | doc `global`: `votingOpen`, `championship`, `match` |

## Como funciona a proteção contra votos duplicados

1. **Camada 1 — LocalStorage:** ao votar, grava `hasVoted=true`. Bloqueia F5,
   atualizar a página e fechar/reabrir o navegador.
2. **Camada 2 — Fingerprint:** gera uma "assinatura" do dispositivo (navegador,
   SO, idioma, timezone, resolução, núcleos de CPU…) e verifica no Firestore se
   aquele fingerprint já votou. Continua bloqueando mesmo se o LocalStorage for
   apagado.

> Não protege 100% contra aba anônima, limpar o navegador ou troca de
> dispositivo — é suficiente para uma votação esportiva simples. Para algo mais
> robusto, dá para trocar o `utils/fingerprint.ts` por uma lib dedicada.

## Deploy

Fluxo: **GitHub → Vercel → Firebase**. Cada `push` na branch `main` gera deploy
automático.

1. Suba o repositório para o GitHub (veja abaixo).
2. Importe o repo na [Vercel](https://vercel.com/new) — o framework Vite é
   detectado automaticamente (config em [`vercel.json`](vercel.json)).
3. Em **Settings > Environment Variables** da Vercel, adicione as mesmas
   variáveis `VITE_FIREBASE_*` do `.env.local`.

## Roadmap / melhorias futuras

Painel de estatísticas, gráficos de votação, histórico por partida, ranking da
temporada, votações simultâneas, upload de fotos, exportação CSV, dashboard
avançado e eventual migração para backend próprio.
