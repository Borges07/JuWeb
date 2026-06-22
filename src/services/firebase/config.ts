// Inicialização do Firebase.
//
// As credenciais vêm de variáveis de ambiente (arquivo .env.local) para não
// ficarem versionadas no Git. Copie o .env.example para .env.local e preencha
// com os dados do seu projeto Firebase (Console > Configurações do projeto).

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Aviso amigável em desenvolvimento caso o .env.local ainda não exista.
if (import.meta.env.DEV && !firebaseConfig.apiKey) {
  console.warn(
    '[Firebase] Variáveis de ambiente não configuradas. ' +
      'Copie .env.example para .env.local e preencha as credenciais.',
  )
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
