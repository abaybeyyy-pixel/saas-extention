import { SignJWT, jwtVerify } from 'jose';

const secret = process.env.JWT_SECRET;
if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}
const JWT_SECRET = new TextEncoder().encode(secret);
const SESSION_EXPIRY = '15m'; // 15 minutes

export interface SessionPayload {
    licenseId: string;
    email: string;
    deviceFingerprint: string;
    plan: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(SESSION_EXPIRY)
        .sign(JWT_SECRET);

    return token;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

export async function createAdminToken(): Promise<string> {
    const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

    return token;
}

export async function verifyAdminToken(token: string): Promise<boolean> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload.role === 'admin';
    } catch {
        return false;
    }
}
