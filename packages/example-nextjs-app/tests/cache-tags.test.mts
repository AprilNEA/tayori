import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { SWRConfig, unstable_serialize, useSWRConfig } from 'swr';
import type { Cache, Middleware } from 'swr';
import { isInternalSWRKey, tayori, unstable_mutateWithTags, unstable_useMutateWithTags } from 'tayori';

const { TayoriProvider, useData, useDataImmutable, useInfinite } = tayori();
const sdkMethod = (options: { query: { id: string } }) => Promise.resolve({ data: options.query.id });
function unexpectedClientCall() {
  throw new Error('SSR must not call the SDK client');
}

function initClient() {
  return {
    buildUrl: unexpectedClientCall,
    getConfig: unexpectedClientCall,
    request: unexpectedClientCall,
    setConfig: unexpectedClientCall
  };
}

function Pages() {
  useInfinite(sdkMethod, page => ({ query: { id: String(page) }, cacheTags: ['#pages' as const] }));
  return null;
}

test('tag invalidation matches object and function query arguments', async (t) => {
  const keys: Array<Parameters<typeof unstable_serialize>[0]> = [];
  let cache: Cache | undefined;
  const captureKeys: Middleware = useSWRNext => (key, fetcher, config) => {
    keys.push(typeof key === 'function' ? Reflect.apply(key, undefined, []) : key);
    return useSWRNext(key, fetcher, config);
  };

  function Queries() {
    cache = useSWRConfig().cache;
    useData(sdkMethod, { query: { id: 'object' }, cacheTags: ['#queries'] });
    useData(sdkMethod, () => ({ query: { id: 'function' }, cacheTags: ['#queries' as const] }));
    useDataImmutable(sdkMethod, () => ({ query: { id: 'immutable' }, cacheTags: ['#queries' as const] }));
    return null;
  }

  renderToString(createElement(TayoriProvider, { initClient },
    createElement(SWRConfig, { value: { use: [captureKeys] } }, createElement(Queries))));
  assert.ok(cache);
  assert.equal(keys.length, 3);
  const queryCache = cache;
  const serializedKeys = keys.map(unstable_serialize);
  t.after(() => serializedKeys.forEach(key => queryCache.delete(key)));

  // SSR does not run SWR's mount effect, which stores the original key as `_k`.
  keys.forEach((key, index) => {
    const entry = { _k: key, data: index };
    queryCache.set(serializedKeys[index], entry);
  });
  assert.deepEqual(await unstable_mutateWithTags(['#queries']), [0, 1, 2]);
  assert.deepEqual(await unstable_mutateWithTags(['#other']), []);
});

test('infinite queries preserve the marker on each page key', () => {
  const pageKeys: unknown[] = [];
  const captureKeys: Middleware = useSWRNext => (key, fetcher, config) => {
    if (typeof key === 'function') {
      pageKeys.push(
        Reflect.apply(key, undefined, [0, null]),
        Reflect.apply(key, undefined, [1, 'first page'])
      );
    }
    return useSWRNext(key, fetcher, config);
  };

  renderToString(createElement(TayoriProvider, { initClient },
    createElement(SWRConfig, { value: { use: [captureKeys] } }, createElement(Pages))));
  assert.equal(pageKeys.length, 2);
  assert.ok(pageKeys.every(isInternalSWRKey));
});

test('the tag invalidation hook uses the current cache provider', async (t) => {
  const customCache: Cache = new Map();
  const caches = new Map<string, Cache>();
  const invalidators = new Map<string, ReturnType<typeof unstable_useMutateWithTags>>();
  const keys: Array<Parameters<typeof unstable_serialize>[0]> = [];
  const captureKeys: Middleware = useSWRNext => (key, fetcher, config) => {
    keys.push(key);
    return useSWRNext(key, fetcher, config);
  };

  function Query({ scope }: { scope: string }) {
    caches.set(scope, useSWRConfig().cache);
    invalidators.set(scope, unstable_useMutateWithTags());
    useData(sdkMethod, { query: { id: 'scoped' }, cacheTags: ['#scoped'] });
    return null;
  }

  renderToString(createElement(TayoriProvider, { initClient },
    createElement(SWRConfig, { value: { use: [captureKeys] } },
      createElement(Query, { scope: 'default' }),
      createElement(SWRConfig, { value: { provider: () => customCache } },
        createElement(Query, { scope: 'custom' })))));

  assert.equal(keys.length, 2);
  assert.equal(unstable_serialize(keys[0]), unstable_serialize(keys[1]));
  const key = keys[0];
  const serializedKey = unstable_serialize(key);
  for (const [scope, cache] of caches) {
    const entry = { _k: key, data: scope };
    cache.set(serializedKey, entry);
    t.after(() => cache.delete(serializedKey));
  }

  const invalidateCustom = invalidators.get('custom');
  assert.ok(invalidateCustom);
  assert.deepEqual(await invalidateCustom(['#scoped']), ['custom']);
  assert.deepEqual(await unstable_mutateWithTags(['#scoped']), ['default']);
});
