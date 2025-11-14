export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) {
      return false;
    }

    let length, i;

    if (Array.isArray(a) && Array.isArray(b)) {
      length = a.length;

      if (length !== b.length) {
        return false;
      }

      for (i = length; i-- !== 0; ) {
        if (!deepEqual(a[i], b[i])) {
          return false;
        }
      }

      return true;
    }

    const keys = Object.keys(a);
    length = keys.length;

    if (length !== Object.keys(b).length) {
      return false;
    }

    for (i = length; i-- !== 0; ) {
      if (!{}.hasOwnProperty.call(b, keys[i]!)) {
        return false;
      }
    }

    for (i = length; i-- !== 0; ) {
      const key = keys[i];
      // @ts-expect-error $$typeof is expected
      if (key === '_owner' && a.$$typeof) {
        continue;
      }

      // @ts-expect-error objects are expected
      if (!deepEqual(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }
  return a !== a && b !== b;
}
