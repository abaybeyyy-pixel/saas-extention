import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateLicenseKey, calculateExpiry, PLAN_CONFIG, PlanType } from '@/lib/license';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, whatsapp, name } = body;

        if (!email || !whatsapp) {
            return NextResponse.json({ success: false, error: 'Email and WhatsApp are required' }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if email already exists
        const { data: existingUser } = await supabaseAdmin
            .from('licenses')
            .select('id, status, license_key')
            .eq('email', normalizedEmail)
            .single();

        if (existingUser) {
            if (existingUser.status === 'PENDING') {
                return NextResponse.json({ success: false, error: 'Registration already pending approval.' }, { status: 400 });
            }
            return NextResponse.json({ success: false, error: 'Email already registered.' }, { status: 400 });
        }

        // MANUAL APPROVAL LOGIC:
        // We insert as PENDING without a key.
        const plan: PlanType = 'TRIAL';
        const expiresAt = calculateExpiry(plan); // Placeholder, will be reset on approval

        // Insert new registration request (PENDING APPROVAL)
        const { error } = await supabaseAdmin
            .from('licenses')
            .insert({
                email: normalizedEmail,
                whatsapp: whatsapp.trim(),
                status: 'PENDING',
                plan: plan,
                expires_at: expiresAt.toISOString(),
                license_key: null,
                device_limit: PLAN_CONFIG[plan].deviceLimit,
                is_active: false
            });

        if (error) {
            console.error('Registration DB Error:', error);
            return NextResponse.json({ success: false, error: 'Database error occurred. Please try again later.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Registration submitted! Please wait for admin approval.',
            status: 'PENDING'
        });

    } catch (error) {
        console.error('Registration API Error:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
