'use client';

import { PLANETS_PAGE_SIZE, useGetAllPlanetsInfinite } from '@/lib/tayori';
import { extractErrorMessage } from 'foxts/extract-error-message';
import { isZodError } from 'tayori';
import { prettifyError } from 'zod';

const PLANET_TYPE_LABELS: Record<string, string> = {
  terrestrial: 'Terrestrial',
  gas_giant: 'Gas Giant',
  ice_giant: 'Ice Giant',
  dwarf: 'Dwarf',
  super_earth: 'Super Earth'
};

export function PlanetInfiniteList() {
  const {
    data: pages,
    error,
    size,
    setSize,
    isLoading,
    isValidating
  } = useGetAllPlanetsInfinite();

  if (isLoading) {
    return <p>Loading planets...</p>;
  }

  if (error) {
    return (
      <p style={{ color: 'red' }}>
        Failed to load planets:{' '}
        {isZodError(error) ? prettifyError(error) : extractErrorMessage(error)}
      </p>
    );
  }

  const planets = pages?.flatMap((page) => page.data ?? []) ?? [];

  if (!planets.length) {
    return <p>No planets found.</p>;
  }

  const lastPage = pages?.[pages.length - 1];
  const total = lastPage?.meta?.total;
  const isReachingEnd = total != null && size * PLANETS_PAGE_SIZE >= total;

  const isLoadingMore = isValidating && pages?.length === size;

  return (
    <section>
      <ul style={{ listStyle: 'none', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', padding: 0 }}>
        {planets.map((planet) => (
          <li key={planet.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem' }}>
            <h3 style={{ marginBottom: '0.25rem' }}>{planet.name}</h3>
            {planet.type && (
              <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem' }}>
                {PLANET_TYPE_LABELS[planet.type] ?? planet.type}
              </p>
            )}
            {planet.description && (
              <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{planet.description}</p>
            )}
            {planet.habitabilityIndex != null && (
              <p style={{ fontSize: '0.8rem' }}>
                Habitability:{' '}
                <strong>{(planet.habitabilityIndex * 100).toFixed(0)}%</strong>
              </p>
            )}
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <button
          type="button"
          onClick={() => setSize(size + 1)}
          disabled={isLoadingMore || isReachingEnd}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            background: isReachingEnd ? '#eee' : '#fff',
            color: isReachingEnd ? '#999' : '#333',
            cursor: (isLoadingMore || isReachingEnd) ? 'not-allowed' : 'pointer',
            opacity: (isLoadingMore || isReachingEnd) ? 0.7 : 1,
            fontSize: '0.9rem'
          }}
        >
          {isLoadingMore ? 'Loading more...' : (isReachingEnd ? 'No more planets' : 'Load More')}
        </button>
      </div>
    </section>
  );
}
