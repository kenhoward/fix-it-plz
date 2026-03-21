// Lightweight env validation — fails fast at startup with a clear message.
// No external dependencies, no schema library. Just a function.

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
