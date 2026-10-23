/**
 * Shared Marketplace Constants & Roles
 */

export const USER_ROLES = {
    BUYER: 'user',
    SELLER: 'seller',
    BRAND: 'seller',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
};

export const BRAND_STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    REJECTED: 'rejected'
};

export const ORDER_FULFILLMENT_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

export const DEFAULT_COMMISSION_RATE = 10.00; // 10% platform fee

export const CLOTHING_CATEGORIES = [
    'Shirts',
    'Jackets & Outerwear',
    'Pants & Denim',
    'Knitwear & Sweaters',
    'Dresses',
    'Activewear',
    'Accessories'
];
