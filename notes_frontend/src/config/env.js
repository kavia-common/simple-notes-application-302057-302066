/**
 * Environment configuration helpers.
 *
 * Important behavior:
 * - The app MUST default to localStorage mode when no backend URL is configured.
 * - We support both REACT_APP_BACKEND_URL and REACT_APP_API_BASE (some templates use either).
 * - When env values are present but the backend is unreachable, service layer will gracefully
 *   fall back to local mode for read operations.
 */

// PUBLIC_INTERFACE
export function getBackendBaseUrl() {
  /** Returns the configured backend base URL (or empty string). */
  const fromBackendUrl = (process.env.REACT_APP_BACKEND_URL || '').trim();
  const fromApiBase = (process.env.REACT_APP_API_BASE || '').trim();
  return fromBackendUrl || fromApiBase || '';
}

// PUBLIC_INTERFACE
export function isBackendConfigured() {
  /** True when a backend base URL is configured (non-empty), false for localStorage mode. */
  return Boolean(getBackendBaseUrl());
}

// PUBLIC_INTERFACE
export function isBackendEnabled() {
  /**
   * Alias for isBackendConfigured() used by the service layer.
   * Naming reflects intent: "enabled" means we are allowed to attempt fetch calls.
   */
  return isBackendConfigured();
}
