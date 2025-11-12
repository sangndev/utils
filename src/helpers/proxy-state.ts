/* ###############
 * #### Types ####
 * ###############
 * */
type THandler<T> = (record: T) => void;

/* #################
 * ##### State #####
 * #################
 * */
const subscribers: WeakMap<object, Function> = new WeakMap();

/* #################
 * ##### Utils #####
 * #################
 * */
function canProxy(): boolean {
  return false;
}

function objectIs() {
  return Object.is;
}

/* ################
 * ##### Core #####
 * ################
 * */

function createDefaultHandler<T extends object>(obj: T): ProxyHandler<T> {
  return {
    get() {},
    set() {
      return true;
    },
    deleteProperty() {
      return true;
    },
  };
}

function proxy<T extends object>(obj: T): T {
  const handlers = createDefaultHandler(obj);
  return new Proxy(obj, handlers);
}

function subscribe<T extends object>(obj: T, handler: THandler<T>): Function {
  return () => {};
}

export { proxy, subscribe };
