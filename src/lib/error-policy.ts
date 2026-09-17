import { ApiError } from "@/lib/api/client";

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isUnauthorized(error: unknown): boolean {
  return isApiError(error) && error.status === 401;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  return isApiError(error) ? error.message : fallback;
}

export function apiErrorProblem(error: unknown): ApiError["problem"] {
  return isApiError(error) ? error.problem : null;
}
