"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAdmin } from "./admin-context";

// Every admin list is cached for 1 hour.
export const ADMIN_CACHE_TTL = 60 * 60 * 1000;

const ROOT = "educore:admin:v1";
const base = (adminId: string) => `${ROOT}:${adminId}:`;

type Entry<T> = { expiresAt: number; savedAt: number; data: T };

export function readCache<T>(key: string): Entry<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry = JSON.parse(raw) as Entry<T>;

    if (!entry.expiresAt || entry.expiresAt <= Date.now()) {
      localStorage.removeItem(key);
      return null;
    }

    return entry;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T, ttl: number): void {
  try {
    const now = Date.now();
    const entry: Entry<T> = { expiresAt: now + ttl, savedAt: now, data };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage full / unavailable: the app still works without cache.
  }
}

// Removes every cached key that starts with one of the given names,
// e.g. invalidateCache(adminId, "exams", "overview").
export function invalidateCache(adminId: string, ...names: string[]): void {
  try {
    const prefixes = names.map((name) => base(adminId) + name);

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
}

export function clearAdminCache(adminId: string): void {
  invalidateCache(adminId, "");
}

// Runs once per full page load. A reload / hard refresh (Ctrl+Shift+R, F5)
// reports navigation type "reload", so the cache is wiped and everything is
// fetched again. Normal in-app navigation keeps using the cache.
let reloadChecked = false;

function purgeOnReload(adminId: string): void {
  if (reloadChecked || typeof window === "undefined") return;
  reloadChecked = true;

  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  if (nav?.type === "reload") clearAdminCache(adminId);
}

export function useCachedData<T>(
  name: string,
  fetcher: () => Promise<T>,
  ttl: number = ADMIN_CACHE_TTL,
) {
  const { adminId } = useAdmin();

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const requestRef = useRef(0);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const load = useCallback(
    async (force: boolean) => {
      const requestId = ++requestRef.current;
      const key = base(adminId) + name;

      if (!force) {
        const hit = readCache<T>(key);

        if (hit) {
          setData(hit.data);
          setCachedAt(hit.savedAt);
          setError("");
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError("");

      try {
        const fresh = await fetcherRef.current();
        if (requestId !== requestRef.current) return; // a newer request won

        writeCache(key, fresh, ttl);
        setData(fresh);
        setCachedAt(Date.now());
      } catch (loadError) {
        if (requestId !== requestRef.current) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load data.",
        );
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [adminId, name, ttl],
  );

  useEffect(() => {
    purgeOnReload(adminId);
    void load(false);
  }, [adminId, load]);

  const refresh = useCallback(() => load(true), [load]);

  return { data, loading, error, cachedAt, refresh };
}
