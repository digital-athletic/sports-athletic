/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_FEATURE_FLAG_DEBUG_SETTINGS_TAB_ENABLED?: string;
  readonly VITE_LINK_A11Y_STATEMENT?: string;
  readonly VITE_LINK_A11Y_FEEDBACK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
