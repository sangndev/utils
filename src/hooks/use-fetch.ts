import { createContext, useCallback, useEffect, useState } from "react";

/* =============================================================================
 * Class
 * =============================================================================
 * */
export class InfoError extends Error {
  info?: any = {};
  status?: number = 400;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/* =============================================================================
 * Types
 * =============================================================================
 * */
type TKey = string | [url: string, request: RequestInit];
type TFetcher<T> = (url: string, request?: RequestInit) => Promise<T>;
type TOptions<T> = {
  onSuccess?: (response: T) => void;
  onError?: (error: Error) => void;
  autoInvoke?: boolean;
};
type TMutateFn<T> = (request?: RequestInit, options?: TOptions<T>) => void;
type TMiddlewares<T> = (next: TMutateFn<T>) => TMutateFn<T>;

/* =============================================================================
 * Context
 * =============================================================================
 * */

type TFetchController = {};

type TFetchConfigContext<T> = {
  use?: TMiddlewares<T>[];
  onError?: (key: string, error: InfoError) => Promise<void> | void;
  controller: TFetchController;
};

const FetchConfigContext = createContext<TFetchConfigContext<any>>({
  controller: {},
});

/* =============================================================================
 * Core
 * =============================================================================
 * */

function applyMiddleware<T>(
  fn: TMutateFn<T>,
  middlewares: TMiddlewares<T>[],
): TMutateFn<T> {
  return middlewares.reduceRight((next, middleware) => middleware(next), fn);
}

export function useFetch<T extends unknown>(
  key: TKey,
  fetcher: TFetcher<T>,
  options?: TOptions<T>,
) {
  /*
   * Variables
   * */
  const { autoInvoke = true, onError, onSuccess } = options ?? {};

  const url: string = typeof key === "string" ? key : key[0];
  const requestInit: RequestInit = Array.isArray(key) ? key[1] : {};

  /*
   * State
   * */
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /*
   * Ref
   * */

  /*
   * Handlers
   * */

  const mutate = useCallback(
    async (request: RequestInit, options: TOptions<T> = {}) => {},
    [url, requestInit],
  );

  /*
   * Effect
   * */
  // Invoke fetch
  useEffect(() => {
    if (autoInvoke) {
      mutate(requestInit);
    }
  }, [mutate, autoInvoke]);

  return {
    mutate,
    data,
    error,
    loading,
  };
}
