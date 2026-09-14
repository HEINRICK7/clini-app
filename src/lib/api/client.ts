import { z } from "zod";

const problemDetailsSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.number().optional(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  possibleMatches: z.array(z.unknown()).optional(),
  conflicts: z.array(z.unknown()).optional(),
});

const csrfResponseSchema = z.object({
  token: z.string().min(1),
});

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly problem: z.infer<typeof problemDetailsSchema> | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

function requestId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `clini-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function fetchCsrfToken(): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/auth/csrf`, {
    credentials: "include",
    headers: { Accept: "application/json", "X-Request-Id": requestId() },
  });

  if (!response.ok) {
    throw new ApiError("Não foi possível iniciar uma operação segura.", response.status, null);
  }

  const parsed = csrfResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new ApiError("O token de segurança retornado pela API é inválido.", 500, null);
  }

  return parsed.data.token;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const requiresCsrf = !["GET", "HEAD", "OPTIONS"].includes(method);
  const csrfToken = requiresCsrf ? await fetchCsrfToken() : undefined;
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Request-Id": requestId(),
      ...(init?.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const rawProblem = await response.json().catch(() => null);
    const problem = problemDetailsSchema.safeParse(rawProblem);
    throw new ApiError(
      problem.success && problem.data.detail
        ? problem.data.detail
        : "Não foi possível concluir a solicitação.",
      response.status,
      problem.success ? problem.data : null,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiDownload(path: string, accept = "application/octet-stream"): Promise<Blob> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: { Accept: accept, "X-Request-Id": requestId() },
  });
  if (!response.ok) {
    const rawProblem = await response.json().catch(() => null);
    const problem = problemDetailsSchema.safeParse(rawProblem);
    throw new ApiError(
      problem.success && problem.data.detail ? problem.data.detail : "Não foi possível baixar o arquivo.",
      response.status,
      problem.success ? problem.data : null,
    );
  }
  return response.blob();
}
