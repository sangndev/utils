export type MiddlewareFn<Ctx> = (context: Ctx) => Promise<Ctx> | Ctx;
export function walkMiddlewares<T>(middlewares: MiddlewareFn[], ctx: T): Promise<T>;
export function getPath(url: string, queryParams: Record<string, string>): string;
