import { NextResponse } from 'next/server';

export function GET() {
	return NextResponse.json({ ok: true, message: 'meshy endpoint is not implemented yet' });
}

