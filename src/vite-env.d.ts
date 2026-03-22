/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Laravel API base, e.g. http://localhost:8000. Leave empty to use same-origin URLs + Vite dev proxy. */
  readonly VITE_API_URL?: string;
  /** Dev only: proxy target for /api, /login, /register when VITE_API_URL is empty. */
  readonly VITE_PROXY_TARGET?: string;
  readonly VITE_DEV_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
