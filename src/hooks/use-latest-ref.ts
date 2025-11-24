import { useRef, useEffect } from "react";

function useLatestRef<T>(value: T) {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

export { useLatestRef };
