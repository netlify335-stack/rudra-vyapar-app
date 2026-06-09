"use client";

import { useEffect, useState } from "react";
import { getLocalDb } from "@/db/local";

export function useLocalDbQuery<T>(queryFn: (db: any) => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getLocalDb()
      .then(async (db) => {
        try {
          const res = await queryFn(db);
          if (active) {
            setData(res);
            setLoading(false);
          }
        } catch (err: any) {
          if (active) {
            setError(err);
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        if (active) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
