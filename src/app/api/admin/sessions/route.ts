import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/jwt';

async function verifyAdmin(request: NextRequest): Promise<boolean> {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return false;
    return await verifyAdminToken(token);
}

// DELETE - Remove specific session (force logout device)
export async function DELETE(request: NextRequest) {
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('id');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Get session info for logging
        const { data: session } = await supabaseAdmin
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (session) {
            // Delete the session
            await supabaseAdmin
                .from('sessions')
                .delete()
                .eq('id', sessionId);

            // Log the force logout
            await supabaseAdmin.from('usages').insert({
                license_id: session.license_id,
                action: 'force_logout',
                device_fingerprint: session.device_fingerprint,
                metadata: { forced_by: 'admin' }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete Session Error:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { success: false, error: 'Failed to delete session' },
            { status: 500 }
        );
    }
}
