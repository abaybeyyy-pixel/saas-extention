import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createSessionToken } from '@/lib/jwt';

// CORS headers for extension
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { licenseKey, email, deviceFingerprint } = body;

        // Validate input
        if (!licenseKey || !email || !deviceFingerprint) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400, headers: corsHeaders }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Get client IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // 1. Find license
        const { data: license, error: licenseError } = await supabaseAdmin
            .from('licenses')
            .select('*')
            .eq('license_key', licenseKey)
            .eq('email', normalizedEmail)
            .single();

        if (licenseError || !license) {
            // Log failed attempt
            await supabaseAdmin.from('usages').insert({
                action: 'login_failed',
                device_fingerprint: deviceFingerprint,
                ip_address: ip,
                metadata: { reason: 'invalid_credentials', email: normalizedEmail }
            });

            return NextResponse.json(
                { success: false, error: 'Invalid license key or email' },
                { status: 401, headers: corsHeaders }
            );
        }

        // 2. Check if license is active
        if (!license.is_active) {
            return NextResponse.json(
                { success: false, error: 'License has been revoked' },
                { status: 403, headers: corsHeaders }
            );
        }

        // 3. Check expiry
        const now = new Date();
        const expiryDate = new Date(license.expires_at);
        if (now > expiryDate) {
            return NextResponse.json(
                { success: false, error: 'License has expired', expiredAt: license.expires_at },
                { status: 403, headers: corsHeaders }
            );
        }

        // 4. Check device limit (anti-sharing)
        const { data: existingSessions } = await supabaseAdmin
            .from('sessions')
            .select('*')
            .eq('license_id', license.id);

        // Check if this device already has a session
        const existingDeviceSession = existingSessions?.find(
            s => s.device_fingerprint === deviceFingerprint
        );

        // Count unique devices (excluding current device if exists)
        const otherDevices = existingSessions?.filter(
            s => s.device_fingerprint !== deviceFingerprint
        ) || [];

        // Check if device limit would be exceeded
        if (!existingDeviceSession && otherDevices.length >= license.device_limit) {
            // Log anti-sharing detection
            await supabaseAdmin.from('usages').insert({
                license_id: license.id,
                action: 'device_limit_exceeded',
                device_fingerprint: deviceFingerprint,
                ip_address: ip,
                metadata: {
                    currentDevices: otherDevices.length,
                    limit: license.device_limit
                }
            });

            return NextResponse.json(
                {
                    success: false,
                    error: `Device limit reached (${license.device_limit} device${license.device_limit > 1 ? 's' : ''} max). Logout from other device first.`
                },
                { status: 403, headers: corsHeaders }
            );
        }

        // 5. Create session token
        const sessionToken = await createSessionToken({
            licenseId: license.id,
            email: license.email,
            deviceFingerprint,
            plan: license.plan
        });

        // 6. Upsert session record
        await supabaseAdmin
            .from('sessions')
            .upsert({
                license_id: license.id,
                device_fingerprint: deviceFingerprint,
                session_token: sessionToken,
                last_heartbeat: new Date().toISOString(),
                ip_address: ip
            }, {
                onConflict: 'license_id,device_fingerprint'
            });

        // 7. Log successful login
        await supabaseAdmin.from('usages').insert({
            license_id: license.id,
            action: 'login',
            device_fingerprint: deviceFingerprint,
            ip_address: ip
        });

        return NextResponse.json({
            success: true,
            token: sessionToken,
            license: {
                email: license.email,
                plan: license.plan,
                expiresAt: license.expires_at
            }
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Validate API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
