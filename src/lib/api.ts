/** Base URL for Laravel API (auth at /login, /register; API at /api/*). */
export const getApiUrl = (): string =>
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const apiUrl = getApiUrl();
