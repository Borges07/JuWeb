// Shell da aplicação: cabeçalho de navegação + área de conteúdo (rotas).

import { NavLink } from 'react-router-dom'
import AppRoutes from './routes'
import { ROUTES } from './constants/routes'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <NavLink to={ROUTES.HOME} className="app__brand">
          ⚽ Destaque do Jogo
        </NavLink>
        <nav className="app__nav">
          <NavLink to={ROUTES.VOTE}>Votar</NavLink>
          <NavLink to={ROUTES.RESULTS}>Resultados</NavLink>
          <NavLink to={ROUTES.ADMIN}>Admin</NavLink>
        </nav>
      </header>

      <main className="app__main">
        <AppRoutes />
      </main>

      <footer className="app__footer">
        <small>Sistema de Votação · feito com React + Firebase</small>
      </footer>
    </div>
  )
}

export default App
