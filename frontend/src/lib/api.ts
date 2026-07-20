export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type HealthStatus = {
  status: "ok" | "error";
  info?: Record<string, unknown>;
  error?: Record<string, unknown>;
  details?: Record<string, unknown>;
};

export type HealthCheckResult = {
  name: string;
  path: string;
  ok: boolean;
  data?: HealthStatus;
  errorMessage?: string;
};

async function checkHealth(name: string, path: string): Promise<HealthCheckResult> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    const data = (await res.json()) as HealthStatus;
    return { name, path, ok: res.ok, data };
  } catch (error) {
    return {
      name,
      path,
      ok: false,
      errorMessage: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export function getHealthChecks(): Promise<HealthCheckResult[]> {
  return Promise.all([
    checkHealth("Backend", "/health"),
    checkHealth("PostgreSQL", "/health/database"),
    checkHealth("Redis", "/health/redis"),
  ]);
}
