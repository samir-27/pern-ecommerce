/**
 * Simple async wrapper to eliminate boilerplate try/catch in Express route controllers
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
