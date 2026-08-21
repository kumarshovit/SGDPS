let cachedCoordinates: { latitude: number; longitude: number; timestamp: number } | null = null;

const CACHE_MAX_AGE_MS = 600000; // 10 minutes

/**
 * Load last known coordinates from localStorage if available
 */
const getSavedCoordinates = (): { latitude: number; longitude: number; timestamp: number } | null => {
  try {
    const raw = localStorage.getItem('sgdps_last_coordinates');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        return parsed;
      }
    }
  } catch {}
  return null;
};

/**
 * Save coordinates to both memory cache and localStorage
 */
const saveCoordinates = (latitude: number, longitude: number): void => {
  const data = { latitude, longitude, timestamp: Date.now() };
  cachedCoordinates = data;
  try {
    localStorage.setItem('sgdps_last_coordinates', JSON.stringify(data));
  } catch {}
};

/**
 * Fetch approximate coordinates from IP geolocation as fallback for local dev / desktops without GPS
 */
const fetchIpCoordinates = async (): Promise<{ latitude?: number; longitude?: number }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json.latitude === 'number' && typeof json.longitude === 'number') {
        saveCoordinates(json.latitude, json.longitude);
        return { latitude: json.latitude, longitude: json.longitude };
      }
    }
  } catch {
    // Secondary fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json && typeof json.latitude === 'number' && typeof json.longitude === 'number') {
          saveCoordinates(json.latitude, json.longitude);
          return { latitude: json.latitude, longitude: json.longitude };
        }
      }
    } catch {}
  }
  return {};
};

/**
 * Proactively requests browser location permission and primes the cache
 */
export const warmUpBrowserCoordinates = (): void => {
  if (typeof window === 'undefined') return;

  if (navigator && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveCoordinates(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Fallback to IP warm-up if GPS unavailable
        fetchIpCoordinates();
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: CACHE_MAX_AGE_MS,
      }
    );
  } else {
    fetchIpCoordinates();
  }
};

/**
 * Quietly retrieves current geographic coordinates in the browser background
 * without blocking UI interaction.
 * Order of resolution:
 * 1. Fresh in-memory cache (< 10 min)
 * 2. Browser geolocation (high accuracy)
 * 3. Browser geolocation (standard accuracy)
 * 4. IP-based geolocation fallback
 * 5. Last saved localStorage coordinates
 */
export const getBrowserCoordinates = async (): Promise<{ latitude?: number; longitude?: number }> => {
  // 1. In-memory cache
  if (cachedCoordinates && Date.now() - cachedCoordinates.timestamp < CACHE_MAX_AGE_MS) {
    return {
      latitude: cachedCoordinates.latitude,
      longitude: cachedCoordinates.longitude,
    };
  }

  // 2. Try browser geolocation
  if (typeof window !== 'undefined' && navigator && navigator.geolocation) {
    const coords = await new Promise<{ latitude?: number; longitude?: number }>((resolve) => {
      let resolved = false;

      const tryFallback = () => {
        if (resolved) return;
        // Try low-accuracy mode
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!resolved) {
              resolved = true;
              saveCoordinates(pos.coords.latitude, pos.coords.longitude);
              resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            }
          },
          () => {
            if (!resolved) {
              resolved = true;
              resolve({});
            }
          },
          { enableHighAccuracy: false, timeout: 3000, maximumAge: CACHE_MAX_AGE_MS }
        );
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!resolved) {
            resolved = true;
            saveCoordinates(pos.coords.latitude, pos.coords.longitude);
            resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          }
        },
        () => {
          tryFallback();
        },
        { enableHighAccuracy: true, timeout: 4000, maximumAge: CACHE_MAX_AGE_MS }
      );

      // Safety timeout after 5s total
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({});
        }
      }, 5500);
    });

    if (typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      return coords;
    }
  }

  // 3. Fallback to IP geolocation
  const ipCoords = await fetchIpCoordinates();
  if (typeof ipCoords.latitude === 'number' && typeof ipCoords.longitude === 'number') {
    return ipCoords;
  }

  // 4. Fallback to last known coordinates in localStorage
  const saved = getSavedCoordinates();
  if (saved) {
    return {
      latitude: saved.latitude,
      longitude: saved.longitude,
    };
  }

  return {};
};

