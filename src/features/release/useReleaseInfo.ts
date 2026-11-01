import { useEffect, useState } from 'react';

export interface ReleaseInfo {
  version: string;
  notes: string[];
  updatedAt: string;
}

export const GITHUB_RELEASE_API =
  'https://api.github.com/repos/suhebdev/apps/releases/tags/staffbook-v1.0.0';
export const RELEASE_CACHE_KEY = 'staffbook:release_info';
export const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEnvelope {
  info: ReleaseInfo;
  cachedAt: number;
}

/**
 * Fetches latest release metadata (version, bullet notes, updated date)
 * from GitHub releases with a 5-second timeout and 10-minute sessionStorage cache.
 * Fails completely silently (returns null) on error/timeout without affecting UI.
 */
export function useReleaseInfo(): ReleaseInfo | null {
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(() => {
    try {
      const raw = sessionStorage.getItem(RELEASE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEnvelope;
        if (
          parsed &&
          parsed.info &&
          Date.now() - parsed.cachedAt < CACHE_TTL_MS
        ) {
          return parsed.info;
        }
      }
    } catch (_) {}
    return null;
  });

  useEffect(() => {
    // If we already have fresh cached info, do not hit the GitHub API
    try {
      const raw = sessionStorage.getItem(RELEASE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEnvelope;
        if (
          parsed &&
          parsed.info &&
          Date.now() - parsed.cachedAt < CACHE_TTL_MS
        ) {
          return;
        }
      }
    } catch (_) {}

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(GITHUB_RELEASE_API, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        clearTimeout(timeoutId);
        if (!data || typeof data !== 'object') return;

        // 1. Extract first x.y.z version from release name (title) or tag_name
        const titleStr = typeof data.name === 'string' ? data.name : '';
        const tagStr = typeof data.tag_name === 'string' ? data.tag_name : '';
        const match =
          titleStr.match(/(?:v)?(\d+\.\d+(?:\.\d+)?)/i) ||
          tagStr.match(/(?:v)?(\d+\.\d+(?:\.\d+)?)/i);

        if (!match) return; // Silent hide if no version pattern found
        const version = `v${match[1]}`;

        // 2. Extract bullet lines from body
        const bodyStr = typeof data.body === 'string' ? data.body : '';
        const bulletLines: string[] = [];
        const rawLines = bodyStr.split(/\r?\n/);
        for (const line of rawLines) {
          const trimmed = line.trim();
          if (
            trimmed.startsWith('-') ||
            trimmed.startsWith('*') ||
            trimmed.startsWith('•')
          ) {
            const clean = trimmed.replace(/^[-*•]\s*/, '').trim();
            if (clean) bulletLines.push(clean);
          }
        }
        const notes = bulletLines.slice(0, 4);

        // 3. Extract updated date
        const dateRaw = data.published_at || data.created_at;
        let updatedAt = '';
        if (dateRaw) {
          try {
            updatedAt = new Date(dateRaw).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
          } catch (_) {}
        }

        const info: ReleaseInfo = {
          version,
          notes,
          updatedAt,
        };

        try {
          sessionStorage.setItem(
            RELEASE_CACHE_KEY,
            JSON.stringify({ info, cachedAt: Date.now() })
          );
        } catch (_) {}

        setReleaseInfo(info);
      })
      .catch(() => {
        // Completely silent on timeout / failure: no error state, no spinners
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return releaseInfo;
}
