export function getBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_PUBLIC_BASE_URL as string | undefined;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    // Ensure no trailing slash
    return envUrl.replace(/\/$/, '');
  }
  // Fallback to runtime origin in browser
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  // Sensible default for SSR/build tools if ever used
  return '';
}

