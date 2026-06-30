// Shell da aplicação: cabeçalho de navegação + área de conteúdo (rotas).

import { NavLink } from 'react-router-dom'
import AppRoutes from './routes'
import { ROUTES } from './constants/routes'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-inner">
          <NavLink to={ROUTES.HOME} className="app__brand">
            <img src="/favicon.png" alt="ADEC Futsal" className="app__logo" />
            <span>ADEC Futsal</span>
          </NavLink>
          <nav className="app__nav">
            <NavLink to={ROUTES.VOTE}>Votação</NavLink>
            <NavLink to={ROUTES.ADMIN}>Admin</NavLink>
          </nav>
        </div>
      </header>

      <main className="app__main">
        <AppRoutes />
      </main>

      <footer className="app__footer">
        <div className="app__footer-inner">
          <small>© ADEC - Futsal</small>
        </div>
      </footer>
    </div>
  )
}

export default App
