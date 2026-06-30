# Sistema de Votação de Destaque do Jogo ⚽

Aplicação web para votação do **destaque da partida** de um time de futebol.
O admin cria **várias votações** (ex.: destaque de um campeonato/escola), cada
uma com seu próprio elenco de atletas e seu próprio controle de abertura, pausa
e encerramento. O torcedor escolhe uma votação e vota entrando com a conta
Google (**1 voto por conta por votação**).

## Stack

- **Frontend:** React + Vite + TypeScript + React Router + Context API
- **Backend (BaaS):** Firebase Authentication + Firestore
- **Deploy:** Vercel (frontend) + Firebase (banco/auth)
- **Anti-voto-duplo:** login Google + voto com `id = uid` por votação (garantido nas regras do Firestore)

> O PDF original especificava JavaScript (`.jsx`). Como o projeto já estava
> montado em **TypeScript**, mantivemos TS — a estrutura de pastas é a mesma.

## Estrutura de pastas

```
src/
  components/        # RankingCard, PlayerModal, Icon, StatusBadge, Loading, ProtectedRoute
  pages/
    Home, Login
    Votacao/         # VotacaoList (cards), VotacaoDetail (votar numa votação)
    Admin/           # AdminLayout, AdminDashboard, AdminPlayers, AdminVotings,
                     # AdminVotingManage, AdminCategories,
                     # voting/ (ResultsBoard, VotingPlayersModal)
  services/
    firebase/        # config.ts (inicialização do Firebase)
    votingService.ts # CRUD de votações + status (abrir/pausar/encerrar)
    playerService.ts # CRUD de atletas (raiz) + consultas por votingId
    voteService.ts   # registrar/apurar votos por votação (subcoleção)
    categoryService.ts # categorias globais
    authService.ts   # login/logout + allowlist de admin
  contexts/          # AuthContext
  hooks/             # useAuth, useVote(votingId)
  routes/            # definição das rotas
  utils/             # validators, image
  constants/         # rotas e nomes de coleções
  types/             # tipos do domínio (Voting, Player, Vote, Category)
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
3. Em **Authentication**, ative os provedores **E-mail/senha** (login do admin)
   e **Google** (login do votante). Cadastre o usuário admin (e-mail + senha) e
   adicione o `uid` dele em um documento da coleção `admins` (id do doc = uid).
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

| Coleção / caminho                       | Campos                                                              |
| --------------------------------------- | ------------------------------------------------------------------ |
| `votings/{id}`                          | `title`, `description`, `status` (`rascunho`/`aberta`/`pausada`/`encerrada`), `createdAt` |
| `players/{playerId}`                    | `name`, `number`, `category?`, `photo?` (data URL base64), `active`, `votingId` (vincula à votação) |
| `votings/{id}/votes/{uid}`              | `playerId`, `createdAt` — id do doc = uid do votante               |
| `categories/{id}`                       | `name` (categorias globais reutilizáveis)                          |
| `admins/{uid}`                          | allowlist de administradores (gerenciada no console)               |

## Como funciona a proteção contra votos duplicados

O voto exige **login com o Google**. O documento de voto usa o **`uid` da conta
como id** dentro da subcoleção `votes` da votação. Como recriar um documento
existente vira *update* (proibido nas regras), fica garantido **1 voto por conta
por votação** no nível do servidor — à prova de limpar cache, trocar de
navegador ou de aparelho. As regras estão em [`firestore.rules`](firestore.rules).

## Deploy

Fluxo: **GitHub → Vercel → Firebase**. Cada `push` na branch `main` gera deploy
automático.

1. Suba o repositório para o GitHub (veja abaixo).
2. Importe o repo na [Vercel](https://vercel.com/new) — o framework Vite é
   detectado automaticamente (config em [`vercel.json`](vercel.json)).
3. Em **Settings > Environment Variables** da Vercel, adicione as mesmas
   variáveis `VITE_FIREBASE_*` do `.env.local`.

## Roadmap / melhorias futuras

Gráficos de votação avançados, histórico por temporada, ranking consolidado,
exportação CSV dos resultados, agendamento de abertura/encerramento e eventual
migração para backend próprio.
