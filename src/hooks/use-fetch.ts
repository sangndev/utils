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

/* =============================================================================
 * Constants
 * =============================================================================
 * */

/* =============================================================================
 * Core
 * =============================================================================
 * */

export function useFetch<T extends unknown>(
  key: TKey,
  fetcher: TFetcher<T>,
  options?: TOptions<T>,
) {}
