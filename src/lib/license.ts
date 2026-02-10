import { nanoid } from 'nanoid';

// Plan configurations
export const PLAN_CONFIG = {
    TRIAL: {
        name: 'Trial',
        duration: 3, // 3 days trial
        deviceLimit: 1,
        price: 0
    },
    PRO: {
        name: 'Pro',
        duration: 36500, // 100 years = Lifetime
        deviceLimit: 1,
        price: 99000
    },
    AGENCY: {
        name: 'Agency',
        duration: 30, // 30 days
        deviceLimit: 3,
        price: 799000
    }
} as const;

export type PlanType = keyof typeof PLAN_CONFIG;

// Generate unique license key
export function generateLicenseKey(): string {
    const prefix = 'LDF';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = nanoid(8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// Calculate expiry date based on plan
export function calculateExpiry(plan: PlanType): Date {
    const days = PLAN_CONFIG[plan].duration;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    expiry.setHours(23, 59, 59, 999);
    return expiry;
}

// Format date for display (Indonesian format)
export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Format price (Indonesian Rupiah)
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(price);
}
