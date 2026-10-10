import { useSyncExternalStore } from "react";

function emptySubscribe() {
  return () => {};
}

/** True only after client mount — first client render still matches SSR. */
export function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
