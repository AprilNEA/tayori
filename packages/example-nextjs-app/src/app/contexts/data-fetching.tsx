'use client';

// We need a separate userland context provider wrapper file so that
// we can init our own SDK client then pass it to TayoriProvider.
//
// Since this is a React Context, you can also access any React state and
// pass that to the Hey API client.
//
// We can also add own custom SWRConfig provider here as well

import { TayoriProvider } from '@/lib/tayori';
import { createClient } from '@/sdk/client';
import { extractErrorMessage } from 'foxts/extract-error-message';
import { wait } from 'foxts/wait';
import { toast } from 'sonner';
import { SWRConfig } from 'swr';

import { isZodError } from 'tayori';
import { prettifyError } from 'zod';

const API_URL = 'https://galaxy.scalar.com';

export default function DataFetchingProvider({ children }: React.PropsWithChildren) {
  // Since this is a React Context, you can access any React state and pass that to your client
  // Here, we inject our authentication into our Hey API client and then pass it to the TayoriProvider
  const { getAuthTokenAsync } = useExampleAuth();
  const initClient = () => createClient({
    baseUrl: API_URL,
    throwOnError: true,
    async auth() {
      await wait(300); // fake delay to demonstrate async auth
      return getAuthTokenAsync();
    },
    // credentials: 'include'
    kyOptions: {
      timeout: 3000,
      // ensure ky's HTTPError is thrown
      throwHttpErrors: true,
      retry: {
        limit: 2,
        retryOnTimeout: true
      }
    }
  });

  return (
    <TayoriProvider initClient={initClient}>
      <SWRConfig
        value={{
        // Here, we add our own SWR config that adds custom toast on error
          onError(err) {
            console.log({ err });

            if (isZodError(err)) {
              toast.error(`Validation error: ${prettifyError(err)}`);
            } else {
              toast.error(`Error fetching data: ${extractErrorMessage(err)}`);
            }
          }
        }}
      >
        {children}
      </SWRConfig>
    </TayoriProvider>
  );
}

// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- example hook
function useExampleAuth() {
  return {
    getAuthTokenAsync(this: void) {
      return 'sukka-example-auth-token';
    }
  };
}
