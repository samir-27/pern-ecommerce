import pool from '../db.js';

export const logAuditEvent = async ({ userId, action, targetEntity, targetId, ipAddress = null, details = {} }) => {
    try {
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, target_entity, target_id, ip_address, details)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId || null, action, targetEntity, targetId || null, ipAddress, JSON.stringify(details)]
        );
    } catch (err) {
        console.error('Audit log failure:', err.message);
    }
};
