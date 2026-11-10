import ApiSection from './components/ApiSection'
import { LakeMap } from './components/LakeMap'

function App() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#explore" aria-label="Virtual Buoys home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>virtual<span className="brand-light">buoys</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a className="nav-active" href="#explore">Explore</a>
          <a className="api-link" href="#api">Access The Data <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <section className="dashboard-heading" id="explore">
        <div>
          <div className="dashboard-kicker"><span className="live-dot" /> Lake Erie · Western basin</div>
          <h1>Explore the lake</h1>
          <p>Follow changing conditions across three virtual buoys.</p>
        </div>
        <span className="synthetic-badge">Synthetic · educational</span>
      </section>

      <LakeMap />

      <section className="about-card" id="about">
        <div><span className="eyebrow">About the network</span><h2>Realistic data, made to learn from.</h2></div>
        <p>These virtual buoys simulate conditions in western Lake Erie. Explore measurements, compare depths, and use the data in your own projects. All readings are synthetic and are not for operational use.</p>
      </section>
      <ApiSection />

      <footer>
        <div className="footer-brand">Virtual Buoys <span>· Lake Erie</span></div>
        <div className="footer-meta">All readings are synthetic · Not for operational use</div>
      </footer>
    </main>
  )
}

export default App
