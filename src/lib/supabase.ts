import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client with service role key - server-side only
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Database types
export interface License {
    id: string;
    license_key: string;
    email: string;
    plan: 'TRIAL' | 'PRO' | 'AGENCY';
    device_limit: number;
    expires_at: string;
    is_active: boolean;
    created_at: string;
}

export interface Session {
    id: string;
    license_id: string;
    device_fingerprint: string;
    session_token: string;
    last_heartbeat: string;
    ip_address: string | null;
    created_at: string;
}

export interface Usage {
    id: string;
    license_id: string;
    action: string;
    device_fingerprint: string | null;
    ip_address: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
}
