import { tayori } from 'tayori';
import { getAllData, createPlanet } from '@/sdk';
import type { Options } from '@/sdk';
import type { RequestResult } from '@/sdk/client';

export const {
  useData,
  useInfinite,
  useMutation,
  TayoriProvider
} = tayori<Options, RequestResult>();

// Typically we want to export a custom hook that wraps useData and useMutation with our SDK methods
// instead of using those two hooks directly in your application.
//
// In this example those custom hooks are placed under the same file for simplicity, but you can choose
// whereever you want to put them and how you want to name them.

export function useGetAllPlanets() {
  return useData(
    getAllData,
    // all request options here are fully typed and have autocompletion!
    { query: {} }
  );
};

export const PLANETS_PAGE_SIZE = 5;

// useInfinite drives offset/limit pagination on top of useSWRInfinite.
// The callback receives pageIndex and the previous page response so we
// can decide when to stop loading more pages.
export function useGetAllPlanetsInfinite() {
  return useInfinite(
    getAllData,
    (pageIndex, previousPageData) => {
      // Stop once we've already fetched up to (or past) the total reported by the server.
      const total = previousPageData?.meta?.total;
      if (total != null && pageIndex * PLANETS_PAGE_SIZE >= total) {
        return null;
      }
      return {
        query: {
          offset: pageIndex * PLANETS_PAGE_SIZE,
          limit: PLANETS_PAGE_SIZE
        }
      };
    }
  );
};

// You can check out the usage of useMutation in the planet-form.tsx component
export function useCreatePlanet() {
  return useMutation(createPlanet);
};
