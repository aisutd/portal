export {};

declare global {
  /**
   * Clerk metadata is a cache the app never writes, so it can still hold a
   * role from an older build. Typed as a plain string so every reader is
   * forced through isKnownRole() before trusting it.
   */
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: string;
    };
    publicMetadata?: {
      role?: string;
    };
  }
}
