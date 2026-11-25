export type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;

export class AppError extends Error {
  constructor(
    readonly status: ErrorStatus,
    message: string,
    readonly issues: unknown = null,
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFound(what: string): AppError {
  return new AppError(404, `${what} not found`);
}

export function forbidden(action: string): AppError {
  return new AppError(403, `Your role cannot ${action}`);
}

export function unauthorized(): AppError {
  return new AppError(401, 'Sign in to continue');
}

export function organizationRequired(): AppError {
  return new AppError(403, 'Select an organization to continue', null, 'organization_required');
}

export function invalidInput(issues: unknown): AppError {
  return new AppError(422, 'Invalid input', issues);
}
