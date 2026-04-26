import { PlanetList } from './components/planet-list';
import { PlanetInfiniteList } from './components/planet-infinite-list';
import { PlanetForm } from './components/planet-form';

export default function Home() {
  return (
    <main>
      <h1 style={{ marginBottom: '1.5rem' }}>Tayori Next.js Example</h1>
      <PlanetForm />
      <hr style={{ marginBottom: '1.5rem', border: 'none', borderTop: '1px solid #e5e7eb' }} />
      <h2 style={{ marginBottom: '1rem' }}>useData (single page)</h2>
      <PlanetList />
      <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
      <h2 style={{ marginBottom: '1rem' }}>useInfinite (paginated)</h2>
      <PlanetInfiniteList />
    </main>
  );
}
