export function getApiBaseUrl(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (envBase) return envBase;

  // Default to same-origin so Vite proxy can forward /api and /ws to backend.
  return '';
}
