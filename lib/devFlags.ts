/**
 * Developer flags — never hardcode these to true.
 * Set EXPO_PUBLIC_DEV_BYPASS_AUTH=true in your .env to enable.
 */
export const DEV_BYPASS_AUTH = process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === 'true';
