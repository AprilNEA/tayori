'use client';

import { useFindPetsByStatus } from '@/lib/tayori';
import { extractErrorMessage } from 'foxts/extract-error-message';
import { isZodError } from 'tayori';
import { prettifyError } from 'zod';

export function PetList() {
  const { data, isLoading, error } = useFindPetsByStatus(['available']);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return (
      <p>Failed to load pets:
        {' '}
        {
          isZodError(error)
            ? prettifyError(error)
            : extractErrorMessage(error)
        }
      </p>
    );
  }

  console.log({ data });

  return (
    <section>
      <h2>Available Pets</h2>
      {JSON.stringify(data, null, 2)}
    </section>
  );
}
