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
        console.error('List Licenses Error:', error instanceof Error ? error.message : 'Unknown error');
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
        console.error('Create License Error:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { success: false, error: 'Failed to create license' },
            { status: 500 }
        );
    }
}

// PUT - Update license
export async function PUT(request: NextRequest) {
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, email, plan } = body;

        if (!id || !email || !plan) {
            return NextResponse.json(
                { error: 'ID, Email and Plan are required' },
                { status: 400 }
            );
        }

        // Recalculate expiry IF plan changed (optional logic, simplifed for now: just update plan display)
        // Real implementation might want to extend expiry or keep it. 
        // Here we update email, plan, and device limit based on new plan config.
        const deviceLimit = PLAN_CONFIG[plan as PlanType].deviceLimit;

        // Check if we also need to extend expiry? For now lets assume "Edit" is correcting data, not extending.
        // To extend, we would need a separate "Extend" action.

        // Check if we need to approve (generate key)
        const { data: existingLicense } = await supabaseAdmin
            .from('licenses')
            .select('license_key, status')
            .eq('id', id)
            .single();

        let updateData: any = {
            email: email.trim().toLowerCase(),
            plan,
            device_limit: deviceLimit,
            is_active: true
        };

        // Approval Logic: If key is missing or we are officially approving
        if (!existingLicense?.license_key || existingLicense?.status === 'PENDING') {
            updateData.license_key = generateLicenseKey();
            updateData.status = 'ACTIVE';
            updateData.starts_at = new Date().toISOString(); // Start subscription now
            updateData.expires_at = calculateExpiry(plan as PlanType).toISOString(); // Reset expiry from now
        }

        const { data: license, error } = await supabaseAdmin
            .from('licenses')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log update
        await supabaseAdmin.from('usages').insert({
            license_id: id,
            action: 'updated',
            metadata: { plan, updated_by: 'admin' }
        });

        return NextResponse.json({ success: true, license });

    } catch (error) {
        console.error('Update License Error:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { success: false, error: 'Failed to update license' },
            { status: 500 }
        );
    }
}

// DELETE - Revoke license (Soft Delete) or Permanent Delete
export async function DELETE(request: NextRequest) {
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const licenseId = searchParams.get('id');
        const permanent = searchParams.get('permanent') === 'true';

        if (!licenseId) {
            return NextResponse.json(
                { error: 'License ID is required' },
                { status: 400 }
            );
        }

        if (permanent) {
            // Hard Delete (Remove from DB)
            // First delete sessions (cascade usually handles this but safety first)
            await supabaseAdmin.from('sessions').delete().eq('license_id', licenseId);

            // Delete usages
            await supabaseAdmin.from('usages').delete().eq('license_id', licenseId);

            // Delete license
            const { error: deleteError } = await supabaseAdmin
                .from('licenses')
                .delete()
                .eq('id', licenseId);

            if (deleteError) throw deleteError;

        } else {
            // Soft Delete (Revoke/Deactivate)
            const { error: updateError } = await supabaseAdmin
                .from('licenses')
                .update({ is_active: false })
                .eq('id', licenseId);

            if (updateError) throw updateError;

            // Delete all sessions for immediate logout
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
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete License Error:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { success: false, error: 'Failed to delete license' },
            { status: 500 }
        );
    }
}
