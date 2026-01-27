
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, whatsapp, name } = body;

        if (!email || !whatsapp) {
            return NextResponse.json({ success: false, error: 'Email and WhatsApp are required' }, { status: 400 });
        }

        // Check if email already exists
        const { data: existingUser } = await supabaseAdmin
            .from('licenses')
            .select('id, status')
            .eq('email', email)
            .single();

        if (existingUser) {
            if (existingUser.status === 'PENDING') {
                return NextResponse.json({ success: false, error: 'Registration already pending approval.' }, { status: 400 });
            }
            return NextResponse.json({ success: false, error: 'Email already registered.' }, { status: 400 });
        }

        // Insert new registration request
        const { error } = await supabaseAdmin
            .from('licenses')
            .insert({
                email,
                whatsapp, // Ensure database schema has this column
                status: 'PENDING',
                plan: 'TRIAL', // Default to TRIAL until approved? Or PENDING status handles it.
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days, can be adjusted on approval
                license_key: null // Key generated on approval
            });

        if (error) {
            console.error('Registration DB Error:', error);
            return NextResponse.json({ success: false, error: 'Database error occurred.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Registration submitted successfully.' });

    } catch (error) {
        console.error('Registration API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
