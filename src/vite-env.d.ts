/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_YOCO_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
