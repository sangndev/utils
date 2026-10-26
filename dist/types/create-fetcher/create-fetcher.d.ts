export type Configs = {
    baseUrl?: string;
    timeout?: number;
    onSuccess?: (key: string, data: any) => Promise<void> | void;
    onError?: (key: string, error: Error | Response) => Promise<void> | void;
    use?: Array<import("./utils.js").MiddlewareFn<FetcherRequestInit>>;
    cache?: Map<string, any>;
};
export function createFetcher({}: Configs): {};
