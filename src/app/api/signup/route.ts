import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
    try {
        const { email, password, name, phone, serviceType } = await request.json();

        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'Service role key missing' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // Creates user and auto-confirms email to bypass rate limit
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, phone, role: 'provider' }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // Upsert provider into public schema
        if (authData.user) {
            await supabaseAdmin.from('users').upsert({
                id: authData.user.id,
                name,
                email,
                phone,
                role: 'provider'
            });

            await supabaseAdmin.from('providers').upsert({
                user_id: authData.user.id,
                name,
                phone,
                service_type: serviceType
            });
        }

        return NextResponse.json({ success: true, user: authData.user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
