export function allowedOrigin(
  origin: string | null,
  expected: string,
  appEnv?: string,
) {
  if (!origin) return false;
  if (origin === expected) return true;
  if (appEnv !== "development") return false;
  try {
    const actual = new URL(origin),
      configured = new URL(expected);
    const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
    return (
      loopback.has(actual.hostname) &&
      loopback.has(configured.hostname) &&
      actual.port === configured.port &&
      actual.protocol === configured.protocol
    );
  } catch {
    return false;
  }
}
