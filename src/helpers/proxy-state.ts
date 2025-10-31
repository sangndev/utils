/* ###############
 * #### Types ####
 * ###############
 * */
type THandler<T> = (record: T) => void;

function proxy<T extends object>(obj: T): T {
  return obj;
}

function subscribe<T extends object>(obj: T, handler: THandler<T>): Function {
  return () => {};
}

export { proxy, subscribe };
