import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { secret } = body;

        const adminSecret = process.env.ADMIN_SECRET;

        if (!adminSecret || secret !== adminSecret) {
            return NextResponse.json(
                { success: false, error: 'Invalid admin credentials' },
                { status: 401 }
            );
        }

        const token = await createAdminToken();

        // Set secure cookie for admin session
        const response = NextResponse.json({
            success: true,
            token
        });

        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return response;

    } catch (error) {
        console.error('Admin Login Error:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
