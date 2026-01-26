import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/jwt';
import { generateLicenseKey, calculateExpiry, PLAN_CONFIG, PlanType } from '@/lib/license';

// Verify admin authentication
async function verifyAdmin(request: NextRequest): Promise<boolean> {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return false;
    return await verifyAdminToken(token);
}

// GET - List all licenses
export async function GET(request: NextRequest) {
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: licenses, error } = await supabaseAdmin
            .from('licenses')
            .select(`
        *,
        sessions (
          id,
          device_fingerprint,
          last_heartbeat,
          ip_address
        )
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, licenses });
    } catch (error) {
        console.error('List Licenses Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch licenses' },
            { status: 500 }
        );
    }
}

// POST - Create new license
export async function POST(request: NextRequest) {
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { email, plan } = body;

        if (!email || !plan) {
            return NextResponse.json(
                { error: 'Email and plan are required' },
                { status: 400 }
            );
        }

        if (!['TRIAL', 'PRO', 'AGENCY'].includes(plan)) {
            return NextResponse.json(
                { error: 'Invalid plan type' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const licenseKey = generateLicenseKey();
        const expiresAt = calculateExpiry(plan as PlanType);
        const deviceLimit = PLAN_CONFIG[plan as PlanType].deviceLimit;

        const { data: license, error } = await supabaseAdmin
            .from('licenses')
            .insert({
                license_key: licenseKey,
                email: normalizedEmail,
                plan,
                device_limit: deviceLimit,
                expires_at: expiresAt.toISOString(),
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        // Log creation
        await supabaseAdmin.from('usages').insert({
            license_id: license.id,
            action: 'created',
            metadata: { plan, created_by: 'admin' }
        });

        return NextResponse.json({ success: true, license });

    } catch (error) {
        console.error('Create License Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create license' },
            { status: 500 }
        );
    }
}

// DELETE - Revoke license
export async function DELETE(request: NextRequest) {
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const licenseId = searchParams.get('id');

        if (!licenseId) {
            return NextResponse.json(
                { error: 'License ID is required' },
                { status: 400 }
            );
        }

        // Deactivate license
        const { error: updateError } = await supabaseAdmin
            .from('licenses')
            .update({ is_active: false })
            .eq('id', licenseId);

        if (updateError) throw updateError;

        // Delete all sessions for this license (instant revoke)
        await supabaseAdmin
            .from('sessions')
            .delete()
            .eq('license_id', licenseId);

        // Log revocation
        await supabaseAdmin.from('usages').insert({
            license_id: licenseId,
            action: 'revoked',
            metadata: { revoked_by: 'admin' }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Revoke License Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to revoke license' },
            { status: 500 }
        );
    }
}
