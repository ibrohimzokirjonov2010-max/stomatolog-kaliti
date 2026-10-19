"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadAppointmentsWithImport, loadPatientsWithImport, replaceCrm } from "@/lib/crm-client";
import { writePatientCache } from "@/data/phone-records";

export function useCrmPatients<T extends { id: string; addedAt?: number }>() {
  return useCrmList<T>("patients");
}

export function useCrmAppointments<T extends { id: string }>() {
  return useCrmList<T>("appointments");
}

function useCrmList<T extends { id: string }>(kind: "patients" | "appointments") {
  const [items, setItemsState] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let cancel = false;
    const load = kind === "patients" ? loadPatientsWithImport<T>() : loadAppointmentsWithImport<T>();
    void load.then((rows) => {
      if (cancel) return;
      setItemsState(rows);
      if (kind === "patients") writePatientCache(rows as never);
      setReady(true);
    });
    return () => {
      cancel = true;
    };
  }, [kind]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const setItems = useCallback((updater: T[] | ((prev: T[]) => T[])) => {
    setItemsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        void replaceCrm(kind, next).then((saved) => {
          if (kind === "patients") writePatientCache((saved.length ? saved : next) as never);
        });
      }, 400);
      return next;
    });
  }, [kind]);

  return [items, setItems, ready] as const;
}
