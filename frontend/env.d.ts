/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_PROJECT_URL: string
  readonly VITE_APP_TG_GROUP: string
  readonly VITE_APP_TG_CHANNEL: string
  readonly VITE_APP_VERSION_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
