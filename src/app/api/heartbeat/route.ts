import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifySessionToken, createSessionToken } from '@/lib/jwt';

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
        // Get token from Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Missing authorization token' },
                { status: 401, headers: corsHeaders }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token
        const payload = await verifySessionToken(token);
        if (!payload) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401, headers: corsHeaders }
            );
        }

        const { licenseId, deviceFingerprint } = payload;

        // Get client IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // 1. Check license is still valid
        const { data: license, error: licenseError } = await supabaseAdmin
            .from('licenses')
            .select('*')
            .eq('id', licenseId)
            .single();

        if (licenseError || !license) {
            return NextResponse.json(
                { success: false, error: 'License not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // 2. Check if license is still active
        if (!license.is_active) {
            // Delete session
            await supabaseAdmin
                .from('sessions')
                .delete()
                .eq('license_id', licenseId)
                .eq('device_fingerprint', deviceFingerprint);

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
                { success: false, error: 'License has expired' },
                { status: 403, headers: corsHeaders }
            );
        }

        // 4. Check session exists
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .select('*')
            .eq('license_id', licenseId)
            .eq('device_fingerprint', deviceFingerprint)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { success: false, error: 'Session not found. Please login again.' },
                { status: 401, headers: corsHeaders }
            );
        }

        // 5. Generate new token
        const newToken = await createSessionToken({
            licenseId: license.id,
            email: license.email,
            deviceFingerprint,
            plan: license.plan
        });

        // 6. Update session with new token and heartbeat time
        await supabaseAdmin
            .from('sessions')
            .update({
                session_token: newToken,
                last_heartbeat: new Date().toISOString(),
                ip_address: ip
            })
            .eq('id', session.id);

        // 7. Log heartbeat (optional - can be disabled for less DB writes)
        // await supabaseAdmin.from('usages').insert({
        //   license_id: license.id,
        //   action: 'heartbeat',
        //   device_fingerprint: deviceFingerprint,
        //   ip_address: ip
        // });

        return NextResponse.json({
            success: true,
            token: newToken,
            expiresAt: license.expires_at
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Heartbeat API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
