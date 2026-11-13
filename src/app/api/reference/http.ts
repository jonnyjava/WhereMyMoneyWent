import type {
  ExtendLoanError,
  OpenLoanError,
  ReturnLoanError,
  LoanNotFound,
} from '@/contexts/reference-lending';
import { assertNever } from '@/shared/assert-never';

export const problem = (status: number, error: { kind: string }): Response =>
  Response.json({ error }, { status });

/** Every error kind must be handled. A new kind fails the typechecker here. */
export function openLoanErrorToResponse(error: OpenLoanError): Response {
  switch (error.kind) {
    case 'InvalidEmail':
    case 'InvalidDueDate':
      return problem(422, error);
    default:
      return assertNever(error);
  }
}

export function extendLoanErrorToResponse(error: ExtendLoanError): Response {
  switch (error.kind) {
    case 'LoanNotFound':
      return problem(404, error);
    case 'LoanAlreadyReturned':
    case 'ExtensionLimitReached':
      return problem(409, error);
    default:
      return assertNever(error);
  }
}

export function returnLoanErrorToResponse(error: ReturnLoanError): Response {
  switch (error.kind) {
    case 'LoanNotFound':
      return problem(404, error);
    case 'LoanAlreadyReturned':
      return problem(409, error);
    default:
      return assertNever(error);
  }
}

export const loanNotFoundToResponse = (error: LoanNotFound): Response => problem(404, error);

/** Input SHAPE validation happens here; business rules live in the domain. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === 'object' && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export const badRequest = (message: string): Response =>
  Response.json({ error: { kind: 'BadRequest', message } }, { status: 400 });
