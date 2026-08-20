let cachedCoordinates: { latitude: number; longitude: number; timestamp: number } | null = null;

/**
 * Proactively requests browser location permission and primes the cache
 */
export const warmUpBrowserCoordinates = (): void => {
  if (typeof window === 'undefined' || !navigator || !navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      cachedCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: Date.now(),
      };
    },
    (error) => {
      console.debug('Geolocation warm-up note:', error?.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 600000, // 10 minutes cache
    }
  );
};

/**
 * Quietly retrieves current geographic coordinates in the browser background
 * without blocking UI interaction or displaying errors.
 */
export const getBrowserCoordinates = (): Promise<{ latitude?: number; longitude?: number }> => {
  return new Promise((resolve) => {
    // 1. If we have fresh cached coordinates (< 10 minutes), resolve immediately
    if (cachedCoordinates && Date.now() - cachedCoordinates.timestamp < 600000) {
      resolve({
        latitude: cachedCoordinates.latitude,
        longitude: cachedCoordinates.longitude,
      });
      return;
    }

    if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
      resolve({});
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        cachedCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        };
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.debug('Geolocation background capture note:', error?.message);
        if (cachedCoordinates) {
          resolve({
            latitude: cachedCoordinates.latitude,
            longitude: cachedCoordinates.longitude,
          });
        } else {
          resolve({});
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 600000,
      }
    );
  });
};

