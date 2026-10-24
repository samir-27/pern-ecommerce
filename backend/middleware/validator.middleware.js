import { body, validationResult } from 'express-validator';

/**
 * Reusable express-validator password rules:
 * - Minimum 6 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (@$!%*?&# etc.)
 */
export const validatePassword = [
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('Password must contain at least one special character (e.g. @$!%*?&#)'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg,
                errors: errors.array() 
            });
        }
        next();
    }
];

export const validatePasswordUpdate = [
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
        .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('New password must contain at least one number')
        .matches(/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('New password must contain at least one special character (e.g. @$!%*?&#)'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg,
                errors: errors.array() 
            });
        }
        next();
    }
];
