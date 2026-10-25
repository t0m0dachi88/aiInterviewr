/**
 * Wrap an async Express handler so rejected promises reach error middleware.
 *
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => any} handler
 */
export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
