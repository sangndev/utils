export function createStore<T>(obj: T, registerStateToStore?: boolean): T;
export function subscribe<T>(obj: T, key: keyof T, handler: Handler): Function;
export function getOriginalObject<T>(obj: T): T;
export function cloneValueStore(obj: object, cached?: WeakSet<object>): any;
export function isObject(obj: object): boolean;
export type Handler = (record: unknown) => void;
export type Key = string | number | symbol;
export type NotifyUpdateFn = (params: {
    path: Key;
    newValue: unknown;
    target: object;
}) => void;
