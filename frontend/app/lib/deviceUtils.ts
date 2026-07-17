/**
 * Device capability check — detects low-end devices (especially Android)
 * and allows components to automatically switch heavy glass surfaces
 * to the "vidrio liviano" (lightweight glass) variant.
 *
 * This is read at runtime by client components, never at build time.
 * The goal is graceful degradation on low-end hardware, not a user-facing toggle.
 */

export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for low-end Android devices
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isLowEndAndroid =
    isAndroid &&
    (/Android\s([0-4])/.test(ua) || // Android 4.x or older
      /Android\s(5|6|7)\..*[Mm]obile/.test(ua)); // Mid-range to low-end Android

  // Check device memory (where supported)
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory;
  const hasLowMemory = memory !== undefined && memory < 4;

  // Check hardware concurrency (CPU cores)
  const hasFewCores =
    navigator.hardwareConcurrency !== undefined &&
    navigator.hardwareConcurrency <= 4;

  return isLowEndAndroid || hasLowMemory || hasFewCores;
}
