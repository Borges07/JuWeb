// Página inicial: apresenta a votação e leva para votar ou ver resultados.

import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import Icon from '../../components/Icon/Icon'

export function Home() {
  return (
    <section className="page home">
      <div className="home__hero">
        <span className="home__eyebrow">
          <Icon name="trophy" /> ADEC Futsal
        </span>
        <h1>Destaque da Partida</h1>
        <p className="page__subtitle">
          Vote no jogador que mais se destacou em campo.
        </p>

        <div className="home__actions">
          <Link className="btn btn--primary btn--lg" to={ROUTES.VOTE}>
            Votar agora <Icon name="arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Home
