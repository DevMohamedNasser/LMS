"use client";

import { useCallback, useEffect, useState } from "react";

import {
  LIST_CACHE_TTL,
  dashboardCacheKey,
  readCache,
  writeCache,
} from "./student-cache";
import { loadStudentDashboardData } from "./actions";
import type { CachedDashboard, DashboardData } from "./types";

export function useDashboardData(studentId: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // حمّل الكاش بعد انتهاء effect الحالي لتجنّب تحديث state بشكل متزامن داخله.
  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      const cached = readCache<CachedDashboard>(dashboardCacheKey(studentId));

      if (cancelled) return;

      if (cached) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      void loadFromApi();
    }, 0);

    async function loadFromApi() {
      try {
        const result = await loadStudentDashboardData();

        if (cancelled) return;

        writeCache(dashboardCacheKey(studentId), {
          expiresAt: Date.now() + LIST_CACHE_TTL,
          data: result,
        } satisfies CachedDashboard);

        setData(result);
        setError("");
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load data.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [studentId]);

  // يستخدم هذا عند طلب تحديث البيانات يدويًا، مثل زر Refresh.
  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      const result = await loadStudentDashboardData();

      writeCache(dashboardCacheKey(studentId), {
        expiresAt: Date.now() + LIST_CACHE_TTL,
        data: result,
      } satisfies CachedDashboard);

      setData(result);
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load data.",
      );
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  return { data, loading, error, refresh };
}
