// Página inicial: apresenta a votação e leva para votar ou ver resultados.

import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export function Home() {
  return (
    <section className="page page--home">
      <h1>Destaque da Partida</h1>
      <p className="page__subtitle">
        Vote no jogador que mais se destacou. É rápido e não precisa de cadastro.
      </p>

      <div className="home__actions">
        <Link className="btn btn--primary" to={ROUTES.VOTE}>
          Votar e ver resultados
        </Link>
      </div>
    </section>
  )
}

export default Home
