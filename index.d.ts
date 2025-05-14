
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      PORT: string;
    }
  }
}

export {};
