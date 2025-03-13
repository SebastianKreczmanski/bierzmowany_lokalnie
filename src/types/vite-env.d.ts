/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DB_HOST: string;
  readonly VITE_DB_USER: string;
  readonly VITE_DB_PASSWORD: string;
  readonly VITE_DB_NAME: string;
  readonly VITE_DB_PORT: string;
  readonly VITE_JWT_SECRET: string;
  readonly VITE_SESSION_TIME: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 