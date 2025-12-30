/**
 * Environment configuration helpers.
 * We intentionally default to local mode when REACT_APP_BACKEND_URL is unset.
 */

// PUBLIC_INTERFACE
export function getBackendBaseUrl() {
  /** Returns the configured backend base URL (or empty string). */
  return (process.env.REACT_APP_BACKEND_URL || '').trim();
}

// PUBLIC_INTERFACE
export function isBackendConfigured() {
  /** True when the app should use a backend (future-ready), false for localStorage mode. */
  return Boolean(getBackendBaseUrl());
}
