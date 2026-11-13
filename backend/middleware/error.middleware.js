/**
 * Custom operational API Error class
 */
export class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Centralized Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
    const message = err.message || 'Internal Server Error';

    // Detailed server logging for debugging
    if (statusCode >= 500) {
        console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
    } else {
        console.warn(`[API WARN ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
    }

    res.status(statusCode).json({
        error: message,
        ...(err.details ? { details: err.details } : {})
    });
};
