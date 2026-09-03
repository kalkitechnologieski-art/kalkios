import { AppError } from './types'

export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E }

export class ResultFactory {
  static ok<T>(data: T): Result<T, never> { return { success: true, data } }
  static fail<E>(error: E): Result<never, E> { return { success: false, error } }
  static async from<T, E = AppError>(
    fn: () => Promise<T>,
    errorMapper?: (err: unknown) => E
  ): Promise<Result<T, E>> {
    try { const data = await fn(); return ResultFactory.ok(data) }
    catch (err) { const mapped = errorMapper ? errorMapper(err) : (err as E); return ResultFactory.fail(mapped) }
  }
}
export function unwrap<T, E>(result: Result<T, E>): T {
  if (!result.success) throw result.error
  return result.data
}
